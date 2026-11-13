<?php

namespace App\Models;

use Database\Factories\ReadingEntryFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property Carbon $read_on
 */
class ReadingEntry extends Model
{
    /** @use HasFactory<ReadingEntryFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'read_on',
        'book',
        'chapter',
        'translation',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'read_on' => 'date',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
