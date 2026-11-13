<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class BibleService
{
    /** @return array<array-key, mixed> */
    public function getBooks(string $translation = 'web'): array
    {
        return Cache::remember("bible:{$translation}:books", now()->addDays(30), function () use ($translation) {
            return $this->fetch("https://bible-api.com/data/{$translation}", 'books'); // [{ id: "GEN", name: "Genesis", url: ... }, ...]
        });
    }

    /** @return array<array-key, mixed> */
    public function getChapterList(string $bookId, string $translation = 'web'): array
    {
        return Cache::remember("bible:{$translation}:{$bookId}:chapters", now()->addDays(30), function () use ($translation, $bookId) {
            return $this->fetch("https://bible-api.com/data/{$translation}/{$bookId}", 'chapters'); // [{ book: "Genesis", chapter: 1, ... }, ...]
        });
    }

    /** @return array<array-key, mixed> */
    public function getChapter(string $translation, string $bookId, int $chapter): array
    {
        $cacheKey = "bible:{$translation}:{$bookId}:{$chapter}";

        return Cache::remember($cacheKey, now()->addDays(30), function () use ($translation, $bookId, $chapter) {
            return $this->fetch("https://bible-api.com/data/{$translation}/{$bookId}/{$chapter}", 'verses', true);
        });
    }

    /** @return array<array-key, mixed> */
    private function fetch(string $url, string $key, bool $fullResponse = false): array
    {
        try {
            $response = Http::connectTimeout(3)->timeout(8)->get($url);
        } catch (ConnectionException) {
            abort(502, 'The Bible text provider is temporarily unavailable. Please try again.');
        }

        abort_if($response->status() === 404, 404, 'This Bible passage or translation was not found.');
        abort_unless($response->successful(), 502, 'Could not reach Bible text provider.');
        $payload = $response->json();
        abort_unless(is_array($payload) && isset($payload[$key]) && is_array($payload[$key]), 502, 'The Bible text provider returned an invalid response.');

        return $fullResponse ? $payload : $payload[$key];
    }
}
