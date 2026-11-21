<?php

namespace App\Http\Controllers;

use App\Services\BibleCatalog;
use App\Services\BibleService;
use App\Services\ReadingMusic;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BibleController extends Controller
{
    public function index(Request $request, BibleService $bible): Response
    {
        $translation = $request->validate([
            'translation' => ['sometimes', 'string', 'max:30', 'regex:/^[a-z0-9_-]+$/'],
        ])['translation'] ?? 'web';

        return Inertia::render('bible/index', [
            'translation' => $translation,
            'books' => $bible->getBooks($translation),
        ]);
    }

    public function chapters(Request $request, string $bookId, BibleService $bible): Response
    {
        $translation = $request->validate([
            'translation' => ['sometimes', 'string', 'max:30', 'regex:/^[a-z0-9_-]+$/'],
        ])['translation'] ?? 'web';

        return Inertia::render('bible/chapters', [
            'translation' => $translation,
            'bookId' => $bookId,
            'chapters' => $bible->getChapterList($bookId, $translation),
        ]);
    }

    public function show(Request $request, string $bookId, int $chapter, BibleService $bible, ReadingMusic $music): Response
    {
        $translation = $request->validate([
            'translation' => ['sometimes', 'string', 'max:30', 'regex:/^[a-z0-9_-]+$/'],
        ])['translation'] ?? 'web';

        if (! preg_match('/^(?:[1-3])?[A-Z]{2,3}$/', $bookId)) {
            $book = collect($bible->getBooks($translation))
                ->first(fn (array $candidate): bool => strcasecmp($candidate['name'], $bookId) === 0);

            abort_unless($book, 404);
            $bookId = $book['id'];
        }

        $catalogBook = BibleCatalog::find($bookId);
        abort_if($catalogBook && ($chapter < 1 || $chapter > $catalogBook['chapters']), 404);

        $passage = $bible->getChapter($translation, $bookId, $chapter);
        // Only a successfully loaded passage becomes the account's reading position.
        // Speculative prefetch requests must not move the reading position.
        if ($catalogBook && ! empty($passage['verses']) && ! $request->prefetch()) {
            $request->user()->forceFill(['last_reading' => [
                'bookId' => $bookId,
                'book' => $catalogBook['name'],
                'chapter' => $chapter,
                'translation' => $translation,
            ]])->save();
        }

        return Inertia::render('read', [
            'songs' => $music->songs(),
            'today' => today()->toDateString(),
            'chapterCount' => $catalogBook['chapters'] ?? $chapter,
            'bookId' => $bookId,
            'chapter' => $chapter,
            'translation' => $translation,
            'passage' => $passage,
            'savedVerses' => $request->user()->savedVerses()->where('book_id', $bookId)->where('chapter', $chapter)->where('translation', $translation)->get()->map(fn ($verse): array => $verse->forClient()),
        ]);
    }
}
