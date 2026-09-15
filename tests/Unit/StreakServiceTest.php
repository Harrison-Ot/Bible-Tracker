<?php

use App\Models\User;
use App\Services\StreakService;

it('returns zero streak when there are no reading entries', function () {
    $user = User::factory()->create();
    $service = new StreakService();

    expect($service->current($user))->toBe(0);
    expect($service->longest($user))->toBe(0);
});

it('counts a current streak of consecutive days ending today', function () {
    $user = User::factory()->create();

    $user->readingEntries()->create(['read_on' => today(), 'book' => 'John', 'chapter' => 1]);
    $user->readingEntries()->create(['read_on' => today()->subDay(), 'book' => 'John', 'chapter' => 2]);
    $user->readingEntries()->create(['read_on' => today()->subDays(2), 'book' => 'John', 'chapter' => 3]);

    $service = new StreakService();

    expect($service->current($user))->toBe(3);
});

it('still counts the streak as current if the last read day was yesterday', function () {
    $user = User::factory()->create();

    $user->readingEntries()->create(['read_on' => today()->subDay(), 'book' => 'John', 'chapter' => 1]);
    $user->readingEntries()->create(['read_on' => today()->subDays(2), 'book' => 'John', 'chapter' => 2]);

    $service = new StreakService();

    expect($service->current($user))->toBe(2);
});

it('resets the current streak to zero if the last read day was two or more days ago', function () {
    $user = User::factory()->create();

    $user->readingEntries()->create(['read_on' => today()->subDays(3), 'book' => 'John', 'chapter' => 1]);

    $service = new StreakService();

    expect($service->current($user))->toBe(0);
});

it('does not double count multiple entries logged on the same day', function () {
    $user = User::factory()->create();

    $user->readingEntries()->create(['read_on' => today(), 'book' => 'John', 'chapter' => 1]);
    $user->readingEntries()->create(['read_on' => today(), 'book' => 'John', 'chapter' => 2]);

    $service = new StreakService();

    expect($service->current($user))->toBe(1);
});

it('finds the longest streak even if it is not the current one', function () {
    $user = User::factory()->create();

    $user->readingEntries()->create(['read_on' => today()->subDays(10), 'book' => 'John', 'chapter' => 1]);
    $user->readingEntries()->create(['read_on' => today()->subDays(9), 'book' => 'John', 'chapter' => 2]);
    $user->readingEntries()->create(['read_on' => today()->subDays(8), 'book' => 'John', 'chapter' => 3]);
    $user->readingEntries()->create(['read_on' => today(), 'book' => 'John', 'chapter' => 4]);

    $service = new StreakService();

    expect($service->longest($user))->toBe(3);
    expect($service->current($user))->toBe(1);
});