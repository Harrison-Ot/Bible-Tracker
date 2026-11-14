<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property list<int> $days
 */
class ReadingReminder extends Model
{
    protected $fillable = ['enabled', 'time', 'timezone', 'days'];

    protected function casts(): array
    {
        return ['enabled' => 'boolean', 'days' => 'array'];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
