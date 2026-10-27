<?php

namespace App\Http\Controllers;

use App\Services\BibleService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BibleController extends Controller
{
    public function index(Request $request, BibleService $bible): Response
    {
        $translation = $request->query('translation', 'web');

        return Inertia::render('bible/index', [
            'translation' => $translation,
            'books' => $bible->getBooks($translation),
        ]);
    }

    public function chapters(Request $request, string $bookId, BibleService $bible): Response
    {
        $translation = $request->query('translation', 'web');

        return Inertia::render('bible/chapters', [
            'translation' => $translation,
            'bookId' => $bookId,
            'chapters' => $bible->getChapterList($bookId, $translation),
        ]);
    }

    public function show(Request $request, string $bookId, int $chapter, BibleService $bible): Response
    {
        $translation = $request->query('translation', 'web');

        if (! preg_match('/^(?:[1-3])?[A-Z]{2,3}$/', $bookId)) {
            $book = collect($bible->getBooks($translation))
                ->first(fn (array $candidate): bool => strcasecmp($candidate['name'], $bookId) === 0);

            abort_unless($book, 404);
            $bookId = $book['id'];
        }

        return Inertia::render('read', [
            'bookId' => $bookId,
            'chapter' => $chapter,
            'translation' => $translation,
            'passage' => $bible->getChapter($translation, $bookId, $chapter),
        ]);
    }
}
