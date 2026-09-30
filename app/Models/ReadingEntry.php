<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReadingEntry extends Model
{
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

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}