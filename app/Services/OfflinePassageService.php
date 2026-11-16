<?php

namespace App\Services;

class OfflinePassageService
{
    /** @return array<string, mixed> */
    public function chapter(string $bookId, int $chapter, BibleService $bible): array
    {
        $book = BibleCatalog::find($bookId);
        abort_unless($book && $chapter >= 1 && $chapter <= $book['chapters'], 404);
        $payload = $bible->getChapter('web', $bookId, $chapter);
        abort_unless(($payload['translation']['identifier'] ?? null) === 'web' && ($payload['translation']['license'] ?? null) === 'Public Domain', 502, 'This passage could not be verified for offline use.');
        $verses = $payload['verses'] ?? [];
        abort_unless(is_array($verses) && count($verses) >= 1 && count($verses) <= 200, 502, 'The provider returned an invalid chapter.');
        $clean = [];
        foreach (array_values($verses) as $index => $verse) {
            abort_unless(is_array($verse) && ($verse['book_id'] ?? null) === $bookId && ($verse['chapter'] ?? null) === $chapter
                && ($verse['verse'] ?? null) === $index + 1 && is_string($verse['text'] ?? null) && trim($verse['text']) !== '' && strlen($verse['text']) <= 20000,
                502, 'The provider returned an invalid chapter.');
            $clean[] = ['verse' => $verse['verse'], 'text' => $verse['text']];
        }
        $result = ['bookId' => $bookId, 'bookName' => $book['name'], 'chapter' => $chapter, 'translation' => 'web', 'verses' => $clean,
            'downloadedAt' => now()->toIso8601String(), 'license' => 'Public Domain', 'licenseUrl' => 'https://www.ebible.org/eng-web/copyright.htm'];
        abort_if(strlen(json_encode($result, JSON_THROW_ON_ERROR)) > 262144, 502, 'This chapter is too large to download.');

        return $result;
    }
}
