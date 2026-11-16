<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** @property CarbonImmutable $started_on */
class GroupReadingRun extends Model
{
    protected $fillable = ['reading_plan_id', 'creation_token', 'current_day', 'started_on', 'completed_at', 'archived_at'];

    protected function casts(): array
    {
        return ['current_day' => 'integer', 'started_on' => 'immutable_date', 'completed_at' => 'immutable_datetime', 'archived_at' => 'immutable_datetime'];
    }

    /** @return BelongsTo<ReadingPlan, $this> */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(ReadingPlan::class, 'reading_plan_id');
    }

    /** @return BelongsTo<Group, $this> */
    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }
}
