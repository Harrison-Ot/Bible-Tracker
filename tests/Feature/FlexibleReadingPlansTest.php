<?php

use App\Models\ReadingPlan;
use App\Models\User;
use App\Models\UserPlanProgress;
use App\Services\ReadingPlanService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

function flexiblePlan(?User $owner = null, int $readings = 4): ReadingPlan
{
    $plan = ReadingPlan::query()->create(['name' => 'A personal journey', 'slug' => 'test-'.Str::uuid(), 'duration_days' => $readings]);
    if ($owner) {
        $plan->forceFill(['user_id' => $owner->id])->save();
    }
    foreach (range(1, $readings) as $day) {
        $plan->days()->create(['day_number' => $day, 'book' => 'Genesis', 'chapters' => (string) $day]);
    }

    return $plan;
}

function flexibleProgress(User $user, ReadingPlan $plan, array $values = []): UserPlanProgress
{
    return $user->readingPlanProgress()->create(array_replace(['reading_plan_id' => $plan->id, 'current_day' => 1,
        'started_on' => '2026-11-10', 'reading_days' => [0, 1, 2, 3, 4, 5, 6], 'next_read_on' => '2026-11-10'], $values));
}

function logFlexibleReading(User $user, string $book, int $chapter, string $date = '2026-11-14', string $translation = 'web'): void
{
    $user->readingEntries()->create(['book' => $book, 'chapter' => $chapter, 'read_on' => $date, 'translation' => $translation]);
}

beforeEach(function () {
    $this->withoutVite();
    $this->travelTo(Carbon::parse('2026-11-14 09:00:00', 'UTC'));
});
afterEach(function () {
    $this->travelBack();
});

it('requires verified authentication for plan creation schedule actions and reports', function () {
    $plan = flexiblePlan();
    foreach (['/reports', '/reading-plans/create'] as $path) {
        $this->get($path)->assertRedirect('/login');
    }
    $this->post('/reading-plans', [])->assertRedirect('/login');
    foreach (['pause', 'resume', 'catch-up'] as $action) {
        $this->post('/reading-plans/'.$plan->id.'/'.$action)->assertRedirect('/login');
    }
    $this->patch('/reading-plans/'.$plan->id.'/schedule', [])->assertRedirect('/login');
    $this->patch('/reports/goal', [])->assertRedirect('/login');
    $this->actingAs(User::factory()->unverified()->create())->get('/reports')->assertRedirect('/email/verify');
});

it('creates a private ordered book-range plan at the chosen pace and weekdays', function () {
    $user = User::factory()->create();
    $this->actingAs($user)->post('/reading-plans', ['creation_token' => (string) Str::uuid(), 'name' => 'My Torah rhythm', 'start_book' => 'GEN', 'end_book' => 'EXO',
        'chapters_per_reading' => 20, 'reading_days' => [1, 3], 'next_read_on' => '2026-11-14', 'user_id' => 999])
        ->assertRedirect('/reading-plans')->assertSessionHasNoErrors();
    $plan = ReadingPlan::query()->sole();
    $progress = $user->readingPlanProgress()->sole();
    expect($plan->user_id)->toBe($user->id)->and($plan->duration_days)->toBe(5)
        ->and($progress->current_day)->toBe(1)->and($progress->next_read_on->toDateString())->toBe('2026-11-16')
        ->and($progress->reading_days)->toBe([1, 3]);
    $service = app(ReadingPlanService::class);
    $all = collect(range(1, 5))->flatMap(fn ($day) => $service->readings($plan, $day));
    expect($all)->toHaveCount(90)->and($all->pluck('reference')->unique())->toHaveCount(90)
        ->and($all->first()['reference'])->toBe('Genesis 1')->and($all->last()['reference'])->toBe('Exodus 40');
    $this->assertDatabaseCount('reading_entries', 0);
});

it('rejects reversed ranges invalid pace empty weekdays and past schedules atomically', function () {
    $this->actingAs(User::factory()->create());
    $valid = ['creation_token' => (string) Str::uuid(), 'name' => 'Test', 'start_book' => 'GEN', 'end_book' => 'EXO', 'chapters_per_reading' => 3, 'reading_days' => [1], 'next_read_on' => '2026-11-14'];
    foreach ([['start_book' => 'REV', 'end_book' => 'GEN'], ['chapters_per_reading' => 0], ['reading_days' => []], ['reading_days' => [8]], ['reading_days' => [1, 1]], ['next_read_on' => '2026-11-13']] as $invalid) {
        $this->post('/reading-plans', array_replace($valid, $invalid))->assertSessionHasErrors();
    }
    $this->assertDatabaseCount('reading_plans', 0);
    $this->assertDatabaseCount('plan_days', 0);
});

it('does not reveal or allow actions on another readers private plan', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $private = flexiblePlan($owner);
    flexibleProgress($owner, $private);
    $public = flexiblePlan();
    $this->actingAs($other)->get('/reading-plans')->assertInertia(fn ($page) => $page->has('plans', 1)->where('plans.0.id', $public->id));
    foreach (['start', 'complete-day', 'catch-up', 'pause', 'resume'] as $action) {
        $this->post('/reading-plans/'.$private->id.'/'.$action)->assertNotFound();
    }
    $this->patch('/reading-plans/'.$private->id.'/schedule', ['reading_days' => [1], 'next_read_on' => '2026-11-16'])->assertNotFound();
});

it('pauses without resetting and resumes on the next selected day', function () {
    $user = User::factory()->create();
    $plan = flexiblePlan();
    $progress = flexibleProgress($user, $plan, ['current_day' => 2, 'reading_days' => [1, 3], 'next_read_on' => '2026-11-11']);
    logFlexibleReading($user, 'Genesis', 2);
    $this->actingAs($user)->post('/reading-plans/'.$plan->id.'/pause')->assertRedirect('/reading-plans');
    expect($progress->fresh()->is_paused)->toBeTrue()->and($progress->fresh()->current_day)->toBe(2);
    $this->get('/dashboard')->assertInertia(fn ($page) => $page->has('activePlans', 0));
    $this->post('/reading-plans/'.$plan->id.'/complete-day', ['expected_day' => 2])->assertSessionHasErrors('readingPlan');
    $this->post('/reading-plans/'.$plan->id.'/catch-up', ['expected_day' => 2])->assertSessionHasErrors('readingPlan');
    $this->post('/reading-plans/'.$plan->id.'/resume')->assertRedirect('/reading-plans');
    expect($progress->fresh()->is_paused)->toBeFalse()->and($progress->fresh()->current_day)->toBe(2)
        ->and($progress->fresh()->next_read_on->toDateString())->toBe('2026-11-16')
        ->and($progress->fresh()->started_on->toDateString())->toBe('2026-11-10');
});

it('keeps an already future schedule when resuming and makes duplicate pause resume harmless', function () {
    $user = User::factory()->create();
    $plan = flexiblePlan();
    $progress = flexibleProgress($user, $plan, ['next_read_on' => '2026-12-01']);
    $this->actingAs($user);
    foreach (['pause', 'pause', 'resume', 'resume'] as $action) {
        $this->post('/reading-plans/'.$plan->id.'/'.$action)->assertRedirect();
    }
    expect($progress->fresh()->next_read_on->toDateString())->toBe('2026-12-01')->and($progress->fresh()->current_day)->toBe(1);
});

it('credits logged readings since the plan start and stops catch up at the first gap', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $plan = flexiblePlan();
    $progress = flexibleProgress($user, $plan, ['current_day' => 2, 'next_read_on' => '2026-11-12']);
    logFlexibleReading($user, 'GEN', 2, '2026-11-13');
    logFlexibleReading($user, 'Genesis', 3);
    logFlexibleReading($other, 'Genesis', 4);
    $this->actingAs($user)->post('/reading-plans/'.$plan->id.'/catch-up', ['expected_day' => 2])->assertSessionHasNoErrors();
    expect($progress->fresh()->current_day)->toBe(4)->and($progress->fresh()->next_read_on->toDateString())->toBe('2026-11-14');
    $this->assertDatabaseCount('reading_plan_completions', 2);
    $this->assertDatabaseCount('reading_entries', 3);
    $this->post('/reading-plans/'.$plan->id.'/catch-up', ['expected_day' => 2])->assertSessionHasNoErrors();
    expect($progress->fresh()->current_day)->toBe(4);
});

it('does not credit readings before the plan start or future dated readings', function () {
    $user = User::factory()->create();
    $plan = flexiblePlan();
    $progress = flexibleProgress($user, $plan);
    logFlexibleReading($user, 'Genesis', 1, '2026-11-09');
    logFlexibleReading($user, 'Genesis', 1, '2026-11-15');
    $this->actingAs($user)->post('/reading-plans/'.$plan->id.'/catch-up', ['expected_day' => 1])->assertSessionHasErrors('readingPlan');
    expect($progress->fresh()->current_day)->toBe(1);
    $this->assertDatabaseCount('reading_plan_completions', 0);
});

it('does not advance twice for a stale completion token even when later readings are logged', function () {
    $user = User::factory()->create();
    $plan = flexiblePlan();
    $progress = flexibleProgress($user, $plan);
    foreach (range(1, 4) as $chapter) {
        logFlexibleReading($user, 'Genesis', $chapter);
    }
    $this->actingAs($user)->post('/reading-plans/'.$plan->id.'/complete-day', ['expected_day' => 1])->assertSessionHasNoErrors();
    $this->post('/reading-plans/'.$plan->id.'/complete-day', ['expected_day' => 1])->assertSessionHasNoErrors();
    expect($progress->fresh()->current_day)->toBe(2);
    $this->assertDatabaseCount('reading_plan_completions', 1);
    $user->readingEntries()->delete();
    $this->post('/reading-plans/'.$plan->id.'/pause')->assertRedirect();
    $this->post('/reading-plans/'.$plan->id.'/resume')->assertRedirect();
    expect($progress->fresh()->current_day)->toBe(2);
    $this->assertDatabaseCount('reading_plan_completions', 1);
});

it('records completion once and keeps completed plans finished', function () {
    $user = User::factory()->create();
    $plan = flexiblePlan(null, 1);
    $progress = flexibleProgress($user, $plan);
    logFlexibleReading($user, 'Genesis', 1);
    $this->actingAs($user)->post('/reading-plans/'.$plan->id.'/complete-day', ['expected_day' => 1])->assertSessionHasNoErrors();
    expect($progress->fresh()->current_day)->toBe(2)->and($progress->fresh()->completed_at)->not->toBeNull()->and($progress->fresh()->next_read_on)->toBeNull();
    foreach (['start', 'complete-day', 'catch-up', 'pause', 'resume'] as $action) {
        $this->post('/reading-plans/'.$plan->id.'/'.$action)->assertSessionHasNoErrors();
    }
    expect($progress->fresh()->current_day)->toBe(2);
    $this->assertDatabaseCount('reading_plan_completions', 1);
    $this->get('/reports')->assertInertia(fn ($page) => $page->where('report.completedPlans', 1));
});

it('reschedules only remaining readings and preserves pause state and completion history', function () {
    $user = User::factory()->create();
    $plan = flexiblePlan();
    $progress = flexibleProgress($user, $plan, ['current_day' => 3, 'is_paused' => true]);
    DB::table('reading_plan_completions')->insert(['user_plan_progress_id' => $progress->id, 'day_number' => 2, 'completed_at' => now()]);
    $this->actingAs($user)->patch('/reading-plans/'.$plan->id.'/schedule', ['reading_days' => [2, 4], 'next_read_on' => '2026-11-16'])->assertSessionHasNoErrors();
    expect($progress->fresh()->current_day)->toBe(3)->and($progress->fresh()->is_paused)->toBeTrue()
        ->and($progress->fresh()->next_read_on->toDateString())->toBe('2026-11-17');
    $this->assertDatabaseCount('reading_plan_completions', 1);
    $this->patch('/reading-plans/'.$plan->id.'/schedule', ['reading_days' => [], 'next_read_on' => '2026-11-16'])->assertSessionHasErrors('reading_days');
});

it('rejects malformed day assignments without partial completion', function () {
    $user = User::factory()->create();
    $plan = flexiblePlan();
    $progress = flexibleProgress($user, $plan);
    $plan->days()->create(['day_number' => 1, 'book' => 'Genesis', 'chapters' => '0']);
    logFlexibleReading($user, 'Genesis', 1);
    $this->actingAs($user)->post('/reading-plans/'.$plan->id.'/complete-day')->assertSessionHasErrors('readingPlan');
    expect($progress->fresh()->current_day)->toBe(1);
});

it('reports private unique chapter book and weekly progress without reread inflation', function () {
    $user = User::factory()->create();
    logFlexibleReading($user, 'John', 1);
    logFlexibleReading($user, 'JHN', 1, '2026-11-14', 'kjv');
    logFlexibleReading($user, 'John', 2, '2026-11-13');
    logFlexibleReading($user, 'Jude', 1);
    logFlexibleReading($user, 'John', 1, '2026-11-01');
    logFlexibleReading($user, 'Unknown', 1);
    logFlexibleReading($user, 'Jude', 2);
    logFlexibleReading($user, 'John', 3, '2026-11-15');
    logFlexibleReading(User::factory()->create(), 'John', 3);
    $this->actingAs($user)->get('/reports')->assertOk()->assertInertia(fn ($page) => $page
        ->component('reports')->where('report.uniqueChapters', 3)->where('report.completedBooks', 1)->where('report.totalChapters', 1189)
        ->where('report.loggedReadings', 5)->where('report.readingDays', 3)->where('report.thisWeek.chapters', 3)->where('report.thisWeek.days', 2)
        ->has('report.weeks', 8)->has('report.books', 66)->where('report.milestones.0.achieved', true));
});

it('keeps weekly goals private and validates useful bounds', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $this->actingAs($user)->patch('/reports/goal', ['weekly_chapter_goal' => 12, 'user_id' => $other->id])->assertRedirect('/reports');
    expect($user->fresh()->weekly_chapter_goal)->toBe(12)->and($other->fresh()->weekly_chapter_goal)->toBe(7);
    foreach ([0, 1190, 'many'] as $invalid) {
        $this->patch('/reports/goal', ['weekly_chapter_goal' => $invalid])->assertSessionHasErrors('weekly_chapter_goal');
    }
});

it('shows empty reports safely and removes custom plans with their account', function () {
    $user = User::factory()->create();
    $plan = flexiblePlan($user);
    $progress = flexibleProgress($user, $plan);
    DB::table('reading_plan_completions')->insert(['user_plan_progress_id' => $progress->id, 'day_number' => 1, 'completed_at' => now()]);
    $this->actingAs($user)->get('/reports')->assertInertia(fn ($page) => $page->where('report.weeklyGoal', 7)->where('report.uniqueChapters', 0)->where('report.thisWeek.chapters', 0)->where('report.milestones.0.achieved', false));
    $user->delete();
    expect($plan->fresh())->toBeNull();
    $this->assertDatabaseCount('reading_plan_completions', 0);
});

it('does not duplicate or reset a custom plan when its creation request is retried', function () {
    $user = User::factory()->create();
    $data = ['creation_token' => (string) Str::uuid(), 'name' => 'My short plan', 'start_book' => 'JUD', 'end_book' => 'JUD', 'chapters_per_reading' => 1, 'reading_days' => [6], 'next_read_on' => '2026-11-14'];
    $this->actingAs($user)->post('/reading-plans', $data)->assertSessionHasNoErrors();
    $progress = $user->readingPlanProgress()->sole();
    $progress->update(['current_day' => 2]);
    $this->post('/reading-plans', $data)->assertSessionHasNoErrors();
    $this->assertDatabaseCount('reading_plans', 1);
    $this->assertDatabaseCount('plan_days', 1);
    expect($progress->fresh()->current_day)->toBe(2);
});
