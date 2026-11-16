<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GroupPost extends Model
{
    protected $fillable = ['user_id', 'post_token', 'book_id', 'chapter', 'body', 'removed_at', 'removed_by'];

    protected function casts(): array
    {
        return ['user_id' => 'integer', 'chapter' => 'integer', 'removed_by' => 'integer', 'removed_at' => 'immutable_datetime'];
    }

    /** @return BelongsTo<User, $this> */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
