<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property CarbonImmutable|null $started_on
 * @property CarbonImmutable|null $next_read_on
 * @property CarbonImmutable|null $completed_at
 * @property list<int>|null $reading_days
 */
class UserPlanProgress extends Model
{
    protected $table = 'user_plan_progress';

    protected $fillable = [
        'user_id',
        'reading_plan_id',
        'current_day',
        'started_on',
        'is_paused', 'reading_days', 'next_read_on', 'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'started_on' => 'immutable_date',
            'current_day' => 'integer', 'is_paused' => 'boolean', 'reading_days' => 'array', 'next_read_on' => 'immutable_date', 'completed_at' => 'immutable_datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<ReadingPlan, $this> */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(ReadingPlan::class, 'reading_plan_id');
    }
}
