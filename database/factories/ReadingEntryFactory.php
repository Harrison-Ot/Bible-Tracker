<?php

namespace Database\Factories;

use App\Models\ReadingEntry;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ReadingEntryFactory extends Factory
{
    protected $model = ReadingEntry::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'read_on' => now()->toDateString(),
            'book' => 'John',
            'chapter' => fake()->numberBetween(1, 21),
            'translation' => 'web',
        ];
    }
}