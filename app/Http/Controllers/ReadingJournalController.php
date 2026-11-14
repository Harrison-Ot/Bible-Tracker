<?php

namespace App\Http\Controllers;

use App\Services\BibleCatalog;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ReadingJournalController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'book' => ['nullable', 'string', Rule::in(array_column(BibleCatalog::books(), 'name'))],
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', ...($request->filled('from') ? ['after_or_equal:from'] : [])],
        ]);

        $entries = $request->user()->readingEntries();
        foreach (preg_split('/\s+/', trim($filters['q'] ?? ''), -1, PREG_SPLIT_NO_EMPTY) ?: [] as $word) {
            // Each word can match a reflection, book or chapter (e.g. "John 3").
            // Escape LIKE metacharacters so searches treat user input literally.
            $pattern = '%'.str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $word).'%';
            $entries->where(function ($query) use ($word, $pattern) {
                $query->whereRaw("note LIKE ? ESCAPE '!'", [$pattern])
                    ->orWhereRaw("book LIKE ? ESCAPE '!'", [$pattern]);
                if (ctype_digit($word)) {
                    $query->orWhere('chapter', (int) $word);
                }
            });
        }
        if (! empty($filters['book'])) {
            $entries->where('book', $filters['book']);
        }
        if (! empty($filters['from'])) {
            $entries->whereDate('read_on', '>=', $filters['from']);
        }
        if (! empty($filters['to'])) {
            $entries->whereDate('read_on', '<=', $filters['to']);
        }

        return Inertia::render('reading-journal', [
            'filters' => $filters,
            'books' => BibleCatalog::books(),
            'readings' => $entries->latest('read_on')->latest('id')->paginate(10)->withQueryString()
                ->through(fn ($entry): array => [
                    'id' => $entry->id,
                    'book' => $entry->book,
                    'chapter' => $entry->chapter,
                    'readOn' => $entry->read_on->toDateString(),
                    'translation' => $entry->translation ?? 'web',
                    'note' => $entry->note,
                ]),
        ]);
    }
}
