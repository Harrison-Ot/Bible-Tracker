<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SavedVerse extends Model
{
    protected $fillable = ['book_id', 'book', 'chapter', 'verse', 'translation', 'text', 'highlighted', 'bookmarked'];

    protected function casts(): array
    {
        return ['chapter' => 'integer', 'verse' => 'integer', 'highlighted' => 'boolean', 'bookmarked' => 'boolean'];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return array{id: int, bookId: string, book: string, chapter: int, verse: int, translation: string, text: string, highlighted: bool, bookmarked: bool, url: string} */
    public function forClient(): array
    {
        return [
            'id' => $this->id, 'bookId' => $this->book_id, 'book' => $this->book,
            'chapter' => $this->chapter, 'verse' => $this->verse, 'translation' => $this->translation,
            'text' => $this->text, 'highlighted' => $this->highlighted, 'bookmarked' => $this->bookmarked,
            'url' => route('bible.show', ['bookId' => $this->book_id, 'chapter' => $this->chapter, 'translation' => $this->translation]).'#verse-'.$this->verse,
        ];
    }
}
