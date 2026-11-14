<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory;

    use Notifiable;

    protected $fillable = [
        'name',
        'email',
        'avatar_path',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $appends = ['avatar_url'];

    /** @return Attribute<string|null, never> */
    protected function avatarUrl(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->avatar_path
                ? Storage::disk('public')->url($this->avatar_path)
                : null,
        );
    }

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_reading' => 'array',
            'password' => 'hashed',
        ];
    }

    /** @return HasOne<ReadingReminder, $this> */
    public function readingReminder(): HasOne
    {
        return $this->hasOne(ReadingReminder::class);
    }

    /** @return HasMany<ReadingEntry, $this> */
    public function readingEntries(): HasMany
    {
        return $this->hasMany(ReadingEntry::class);
    }

    /** @return BelongsToMany<Group, $this> */
    public function groups(): BelongsToMany
    {
        return $this->belongsToMany(Group::class);
    }

    /** @return BelongsToMany<Badge, $this> */
    public function badges(): BelongsToMany
    {
        return $this->belongsToMany(Badge::class, 'user_badges')
            ->withPivot('earned_at');
    }

    /** @return HasMany<ConnectionRequest, $this> */
    public function sentConnectionRequests(): HasMany
    {
        return $this->hasMany(ConnectionRequest::class, 'sender_id');
    }

    /** @return HasMany<ConnectionRequest, $this> */
    public function receivedConnectionRequests(): HasMany
    {
        return $this->hasMany(ConnectionRequest::class, 'recipient_id');
    }

    /** @return HasMany<UserPlanProgress, $this> */
    public function readingPlanProgress(): HasMany
    {
        return $this->hasMany(UserPlanProgress::class);
    }
}
