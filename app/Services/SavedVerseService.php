<?php

namespace App\Services;

use App\Models\SavedVerse;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SavedVerseService
{
    public function __construct(private BibleService $bible) {}

    /** @return array<int, string> */
    public function passageTexts(string $bookId, int $chapter, string $translation): array
    {
        $passage = $this->bible->getChapter($translation, $bookId, $chapter);
        $texts = [];
        foreach ($passage['verses'] as $verse) {
            abort_unless(is_array($verse) && isset($verse['verse'], $verse['text']) && is_numeric($verse['verse']) && is_string($verse['text']), 502, 'The Bible text provider returned invalid verse data.');
            $texts[(int) $verse['verse']] = trim($verse['text']);
        }

        return $texts;
    }

    /**
     * @param  array{book_id: string, chapter: int, verse: int, translation: string}  $coordinates
     * @param  array{highlighted?: bool, bookmarked?: bool}  $flags
     */
    public function save(User $user, array $coordinates, array $flags, ?string $importText = null): ?SavedVerse
    {
        $existing = $user->savedVerses()->where($coordinates)->first();
        $creating = in_array(true, $flags, true);
        $text = $existing->text ?? $importText;
        if (! $existing && $creating && $text === null) {
            $text = $this->passageTexts($coordinates['book_id'], $coordinates['chapter'], $coordinates['translation'])[$coordinates['verse']] ?? null;
            if (! $text) {
                throw ValidationException::withMessages(['verse' => 'This verse is not available in the selected chapter and translation.']);
            }
        }
        $book = BibleCatalog::find($coordinates['book_id']);
        if (! $book) {
            throw ValidationException::withMessages(['book_id' => 'Choose a book of the Bible.']);
        }

        return DB::transaction(function () use ($user, $coordinates, $flags, $creating, $text, $book): ?SavedVerse {
            $saved = $user->savedVerses()->where($coordinates)->lockForUpdate()->first();
            if (! $saved && ! $creating) {
                return null;
            }
            $saved ??= $user->savedVerses()->firstOrCreate($coordinates, [
                'book' => $book['name'], 'text' => $text, 'highlighted' => false, 'bookmarked' => false,
            ]);
            $saved->fill($flags);
            if (! $saved->highlighted && ! $saved->bookmarked) {
                $saved->delete();

                return null;
            }
            $saved->save();

            return $saved;
        }, 3);
    }
}
