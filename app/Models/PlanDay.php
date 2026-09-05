<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlanDay extends Model
{
    protected $fillable = [
        'reading_plan_id',
        'day_number',
        'book',
        'chapters',
    ];

    public function plan(): BelongsTo
    {
        return $this->belongsTo(ReadingPlan::class, 'reading_plan_id');
    }
}