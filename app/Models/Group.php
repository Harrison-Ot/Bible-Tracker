<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Group extends Model
{
    protected $fillable = ['name', 'description', 'owner_id', 'created_by_id', 'creation_token', 'discussions_locked', 'current_run_id', 'whatsapp_jid', 'invite_link', 'daily_nudge_time'];

    protected $hidden = ['whatsapp_jid', 'invite_link', 'creation_token'];

    protected function casts(): array
    {
        return ['owner_id' => 'integer', 'created_by_id' => 'integer', 'current_run_id' => 'integer', 'discussions_locked' => 'boolean'];
    }

    /** @return BelongsTo<User, $this> */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /** @return BelongsToMany<User, $this> */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class)->withPivot('role')->withTimestamps();
    }

    /** @return HasMany<GroupInvitation, $this> */
    public function invitations(): HasMany
    {
        return $this->hasMany(GroupInvitation::class);
    }

    /** @return HasMany<GroupReadingRun, $this> */
    public function runs(): HasMany
    {
        return $this->hasMany(GroupReadingRun::class);
    }

    /** @return HasMany<GroupPost, $this> */
    public function posts(): HasMany
    {
        return $this->hasMany(GroupPost::class);
    }
}
