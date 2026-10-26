<?php

use App\Models\PlanDay;
use App\Models\ReadingPlan;
use App\Models\User;
use App\Models\UserPlanProgress;
use Database\Seeders\ReadingPlanSeeder;

beforeEach(function () {
    $this->seed(ReadingPlanSeeder::class);
});

test('guests are redirected from reading plans', function () {
    $this->get(route('reading-plans.index'))->assertRedirect(route('login'));
});

test('reading plans show the four curated durations and contents', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->get(route('reading-plans.index'))
        ->assertInertia(fn ($page) => $page
            ->component('reading-plans/index')
            ->has('plans', 4)
            ->where('plans.0.slug', 'wisdom-literature')
            ->where('plans.0.durationDays', 15)
            ->where('plans.1.slug', 'gospels-only')
            ->where('plans.1.durationDays', 30)
            ->where('plans.2.slug', 'new-testament-challenge')
            ->where('plans.2.durationDays', 90)
            ->where('plans.3.slug', 'blueprint')
            ->where('plans.3.durationDays', 365)
        );
});

test('seeder creates complete ordered chapter readings for each curated plan', function () {
    $blueprint = ReadingPlan::query()->where('slug', 'blueprint')->firstOrFail();
    $newTestament = ReadingPlan::query()->where('slug', 'new-testament-challenge')->firstOrFail();
    $gospels = ReadingPlan::query()->where('slug', 'gospels-only')->firstOrFail();
    $wisdom = ReadingPlan::query()->where('slug', 'wisdom-literature')->firstOrFail();

    expect($blueprint->days()->distinct('day_number')->count('day_number'))->toBe(365)
        ->and($blueprint->days()->where('book', 'Genesis')->where('chapters', '1-3')->exists())->toBeTrue()
        ->and($blueprint->days()->where('book', 'Revelation')->exists())->toBeTrue();

    expect($newTestament->days()->where('book', 'Matthew')->exists())->toBeTrue()
        ->and($newTestament->days()->where('book', 'Revelation')->exists())->toBeTrue()
        ->and($newTestament->days()->where('book', 'Genesis')->exists())->toBeFalse();

    expect($gospels->days()->distinct('day_number')->count('day_number'))->toBe(30)
        ->and($gospels->days()->whereIn('book', ['Matthew', 'Mark', 'Luke', 'John'])->count())->toBeGreaterThan(0)
        ->and($gospels->days()->where('book', 'Acts')->exists())->toBeFalse();

    expect($wisdom->days()->distinct('day_number')->count('day_number'))->toBe(15)
        ->and($wisdom->days()->whereIn('book', ['Psalms', 'Proverbs', 'Ecclesiastes'])->count())->toBeGreaterThan(0)
        ->and($wisdom->days()->where('book', 'Job')->exists())->toBeFalse();
});

test('user can start a plan and see its first daily reading', function () {
    $user = User::factory()->create();
    $plan = ReadingPlan::query()->where('slug', 'gospels-only')->firstOrFail();

    $this->actingAs($user)->post(route('reading-plans.store', $plan))->assertRedirect(route('reading-plans.index'));

    $progress = UserPlanProgress::query()->sole();
    expect($progress->user_id)->toBe($user->id)
        ->and($progress->reading_plan_id)->toBe($plan->id)
        ->and($progress->current_day)->toBe(1)
        ->and($progress->started_on->toDateString())->toBe(today()->toDateString());

    $this->get(route('reading-plans.index'))
        ->assertInertia(fn ($page) => $page
            ->where('plans.1.currentDay', 1)
            ->has('plans.1.todayReadings', 1)
        );
});

test('restarting the same plan does not reset existing progress', function () {
    $user = User::factory()->create();
    $plan = ReadingPlan::query()->where('slug', 'wisdom-literature')->firstOrFail();
    $progress = UserPlanProgress::query()->create([
        'user_id' => $user->id,
        'reading_plan_id' => $plan->id,
        'current_day' => 5,
        'started_on' => today()->subDays(4),
    ]);

    $this->actingAs($user)->post(route('reading-plans.store', $plan))->assertRedirect(route('reading-plans.index'));

    expect(UserPlanProgress::query()->sole()->current_day)->toBe(5)
        ->and($progress->fresh()->started_on->toDateString())->toBe(today()->subDays(4)->toDateString());
});

test('user can advance their own plan one day at a time and cannot alter another users progress', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $plan = ReadingPlan::query()->where('slug', 'wisdom-literature')->firstOrFail();
    $progress = UserPlanProgress::query()->create([
        'user_id' => $user->id,
        'reading_plan_id' => $plan->id,
        'current_day' => 1,
        'started_on' => today(),
    ]);
    $otherProgress = UserPlanProgress::query()->create([
        'user_id' => $other->id,
        'reading_plan_id' => $plan->id,
        'current_day' => 3,
        'started_on' => today()->subDays(2),
    ]);

    $this->actingAs($user)->post(route('reading-plans.complete-day', $plan))->assertRedirect(route('reading-plans.index'));

    expect($progress->fresh()->current_day)->toBe(2)
        ->and($otherProgress->fresh()->current_day)->toBe(3);
});

test('completed plan does not advance past its duration', function () {
    $user = User::factory()->create();
    $plan = ReadingPlan::query()->where('slug', 'wisdom-literature')->firstOrFail();
    $progress = UserPlanProgress::query()->create([
        'user_id' => $user->id,
        'reading_plan_id' => $plan->id,
        'current_day' => 16,
        'started_on' => today()->subDays(15),
    ]);

    $this->actingAs($user)->post(route('reading-plans.complete-day', $plan))->assertRedirect(route('reading-plans.index'));

    expect($progress->fresh()->current_day)->toBe(16);
});

test('seeding plans more than once keeps the curated catalog to four plans', function () {
    $this->seed(ReadingPlanSeeder::class);

    expect(ReadingPlan::query()->count())->toBe(4)
        ->and(PlanDay::query()->whereHas('plan', fn ($query) => $query->where('slug', 'gospels-only'))->count())->toBeGreaterThan(0);
});
