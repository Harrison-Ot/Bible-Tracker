<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReadingPlan extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'duration_days',
    ];

    public function days(): HasMany
    {
        return $this->hasMany(PlanDay::class)->orderBy('day_number');
    }
}