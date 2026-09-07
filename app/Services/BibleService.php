<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class BibleService
{
    public function getBooks(string $translation = 'web'): array
    {
        return Cache::remember("bible:{$translation}:books", now()->addDays(30), function () use ($translation) {
            $response = Http::timeout(5)->get("https://bible-api.com/data/{$translation}");

            abort_unless($response->successful(), 502, 'Could not reach Bible text provider.');

            return $response->json('books'); // [{ id: "GEN", name: "Genesis", url: ... }, ...]
        });
    }

    public function getChapterList(string $bookId, string $translation = 'web'): array
    {
        return Cache::remember("bible:{$translation}:{$bookId}:chapters", now()->addDays(30), function () use ($translation, $bookId) {
            $response = Http::timeout(5)->get("https://bible-api.com/data/{$translation}/{$bookId}");

            abort_unless($response->successful(), 502, 'Could not reach Bible text provider.');

            return $response->json('chapters'); // [{ book: "Genesis", chapter: 1, ... }, ...]
        });
    }

    public function getChapter(string $translation, string $bookId, int $chapter): array
    {
        $cacheKey = "bible:{$translation}:{$bookId}:{$chapter}";

        return Cache::remember($cacheKey, now()->addDays(30), function () use ($translation, $bookId, $chapter) {
            $response = Http::timeout(5)->get("https://bible-api.com/data/{$translation}/{$bookId}/{$chapter}");

            abort_unless($response->successful(), 502, 'Could not reach Bible text provider.');

            return $response->json();
        });
    }
}