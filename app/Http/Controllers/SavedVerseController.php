<?php

namespace App\Http\Controllers;

use App\Models\SavedVerse;
use App\Services\BibleCatalog;
use App\Services\SavedVerseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SavedVerseController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'book' => ['nullable', Rule::in(array_column(BibleCatalog::books(), 'id'))],
            'kind' => ['nullable', Rule::in(['highlighted', 'bookmarked'])],
            'translation' => ['nullable', 'string', 'max:30', 'regex:/^[a-z0-9_-]+$/'],
        ]);
        $query = $request->user()->savedVerses();
        $search = trim($filters['q'] ?? '');
        if (preg_match('/^(.+?)\s+(\d+)(?::(\d+))?$/', $search, $matches) && ($book = BibleCatalog::find($matches[1]))) {
            $query->where('book_id', $book['id'])->where('chapter', (int) $matches[2]);
            if (isset($matches[3])) {
                $query->where('verse', (int) $matches[3]);
            }
        } else {
            foreach (preg_split('/\s+/', $search, -1, PREG_SPLIT_NO_EMPTY) ?: [] as $word) {
                $pattern = '%'.str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $word).'%';
                $query->where(fn ($builder) => $builder->whereRaw("text LIKE ? ESCAPE '!'", [$pattern])->orWhereRaw("book LIKE ? ESCAPE '!'", [$pattern]));
            }
        }
        if (! empty($filters['book'])) {
            $query->where('book_id', $filters['book']);
        }
        if (! empty($filters['kind'])) {
            $query->where($filters['kind'], true);
        }
        if (! empty($filters['translation'])) {
            $query->where('translation', $filters['translation']);
        }

        return Inertia::render('saved-verses', [
            'filters' => $filters,
            'books' => BibleCatalog::books(),
            'translations' => $request->user()->savedVerses()->distinct()->orderBy('translation')->pluck('translation'),
            'verses' => $query->latest('id')->paginate(12)->withQueryString()->through(fn (SavedVerse $verse): array => $verse->forClient()),
        ]);
    }

    public function store(Request $request, SavedVerseService $service): JsonResponse
    {
        $coordinates = $this->coordinates($request);
        $verse = $request->validate(['verse' => ['required', 'integer', 'between:1,200']]);
        $coordinates['verse'] = (int) $verse['verse'];
        $flags = $request->validate(['highlighted' => ['sometimes', 'boolean'], 'bookmarked' => ['sometimes', 'boolean']]);
        if ($flags === []) {
            throw ValidationException::withMessages(['verse' => 'Choose a highlight or bookmark action.']);
        }
        $flags = array_map(fn ($value): bool => (bool) $value, $flags);
        $saved = $service->save($request->user(), $coordinates, $flags);

        return response()->json(['savedVerse' => $saved?->forClient()]);
    }

    public function import(Request $request, SavedVerseService $service): JsonResponse
    {
        $coordinates = $this->coordinates($request);
        $validated = $request->validate(['verses' => ['required', 'array', 'min:1', 'max:200'], 'verses.*' => ['required', 'integer', 'between:1,200']]);
        $verses = array_values(array_unique(array_map('intval', $validated['verses'])));
        $texts = $service->passageTexts($coordinates['book_id'], $coordinates['chapter'], $coordinates['translation']);
        foreach ($verses as $number) {
            if (empty($texts[$number])) {
                throw ValidationException::withMessages(['verses' => 'Some highlights do not exist in this chapter and translation.']);
            }
        }
        $imported = 0;
        $saved = DB::transaction(function () use ($request, $service, $coordinates, $verses, $texts, &$imported): array {
            $result = [];
            foreach ($verses as $number) {
                $key = [...$coordinates, 'verse' => $number];
                $previous = $request->user()->savedVerses()->where($key)->lockForUpdate()->first();
                $imported += $previous?->highlighted ? 0 : 1;
                $result[] = $service->save($request->user(), $key, ['highlighted' => true], $texts[$number])->forClient();
            }

            return $result;
        });

        return response()->json(['savedVerses' => $saved, 'imported' => $imported]);
    }

    public function clearHighlights(Request $request): JsonResponse
    {
        $coordinates = $this->coordinates($request);
        $saved = DB::transaction(function () use ($request, $coordinates) {
            $query = $request->user()->savedVerses()->where($coordinates);
            $query->lockForUpdate()->get();
            (clone $query)->update(['highlighted' => false]);
            (clone $query)->where('bookmarked', false)->delete();

            return $query->get()->map(fn (SavedVerse $verse): array => $verse->forClient());
        });

        return response()->json(['savedVerses' => $saved]);
    }

    public function destroy(Request $request, SavedVerse $savedVerse): JsonResponse
    {
        abort_unless($savedVerse->user_id === $request->user()->id, 403);
        $savedVerse->delete();

        return response()->json(['removed' => true]);
    }

    /** @return array{book_id: string, chapter: int, translation: string} */
    private function coordinates(Request $request): array
    {
        $rules = [
            'book_id' => ['required', 'string', Rule::in(array_column(BibleCatalog::books(), 'id'))],
            'chapter' => ['required', 'integer', 'min:1', 'max:150'],
            'translation' => ['required', 'string', 'max:30', 'regex:/^[a-z0-9_-]+$/'],
        ];
        $validated = $request->validate($rules);
        $book = BibleCatalog::find($validated['book_id']);
        if (! $book || $validated['chapter'] > $book['chapters']) {
            throw ValidationException::withMessages(['chapter' => 'Choose a valid chapter for this book.']);
        }
        $validated['chapter'] = (int) $validated['chapter'];

        return $validated;
    }
}
