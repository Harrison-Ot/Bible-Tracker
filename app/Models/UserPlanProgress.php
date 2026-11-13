<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property Carbon|null $started_on
 */
class UserPlanProgress extends Model
{
    protected $table = 'user_plan_progress';

    protected $fillable = [
        'user_id',
        'reading_plan_id',
        'current_day',
        'started_on',
    ];

    protected function casts(): array
    {
        return [
            'started_on' => 'date',
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
