<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReadingPlan extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'duration_days',
    ];

    protected function casts(): array
    {
        return ['duration_days' => 'integer', 'user_id' => 'integer'];
    }

    /** @return HasMany<PlanDay, $this> */
    public function days(): HasMany
    {
        return $this->hasMany(PlanDay::class)->orderBy('day_number');
    }
}
