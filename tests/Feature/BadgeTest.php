<?php

use App\Models\Badge;
use App\Models\ReadingEntry;
use App\Models\ReadingPlan;
use App\Models\User;
use App\Services\BadgeService;
use App\Services\BibleCatalog;
use Illuminate\Support\Facades\DB;

function logBadgeChapter(User $user, string $book = 'John', int $chapter = 1, ?string $date = null): ReadingEntry
{
    return $user->readingEntries()->create(['book' => $book, 'chapter' => $chapter, 'read_on' => $date ?? today(), 'translation' => 'web']);
}

it('awards the first chapter immediately and never duplicates or changes its earned time', function () {
    $user = User::factory()->create();
    $entry = logBadgeChapter($user);
    $earnedAt = DB::table('user_badges')->where('user_id', $user->id)->value('earned_at');
    expect($user->badges()->pluck('key')->all())->toBe(['chapters_1']);
    $this->travel(2)->days();
    app(BadgeService::class)->forUser($user);
    $entry->delete();
    app(BadgeService::class)->forUser($user);
    expect($user->badges()->count())->toBe(1)
        ->and(DB::table('user_badges')->where('user_id', $user->id)->value('earned_at'))->toBe($earnedAt);
    $this->travelBack();
});

it('does not award for future dates or invalid passages', function () {
    $user = User::factory()->create();
    logBadgeChapter($user, 'John', 1, today()->addDay()->toDateString());
    logBadgeChapter($user, 'Unknown', 1);
    logBadgeChapter($user, 'Jude', 2);
    expect($user->badges()->count())->toBe(0);
});

it('counts unique canonical chapters rather than repeated readings or translations', function () {
    $user = User::factory()->create();
    foreach (range(1, 9) as $chapter) {
        logBadgeChapter($user, 'John', $chapter);
    }
    logBadgeChapter($user, 'JHN', 1);
    expect($user->badges()->where('key', 'chapters_10')->exists())->toBeFalse();
    logBadgeChapter($user, 'John', 10);
    expect($user->badges()->where('key', 'chapters_10')->exists())->toBeTrue();
});

it('awards a complete book only after all distinct chapters are read', function () {
    $user = User::factory()->create();
    foreach (range(1, 4) as $chapter) {
        logBadgeChapter($user, 'James', $chapter);
    }
    logBadgeChapter($user, 'James', 1);
    expect($user->badges()->where('key', 'first_book')->exists())->toBeFalse();
    logBadgeChapter($user, 'James', 5);
    expect($user->badges()->where('key', 'first_book')->exists())->toBeTrue();
});

it('awards a completed plan immediately and keeps it after the plan is restarted', function () {
    $user = User::factory()->create();
    $plan = ReadingPlan::query()->create(['name' => 'A short plan', 'slug' => 'badge-plan', 'duration_days' => 1]);
    $progress = $user->readingPlanProgress()->create(['reading_plan_id' => $plan->id, 'current_day' => 1, 'started_on' => today()]);
    expect($user->badges()->count())->toBe(0);
    $progress->update(['current_day' => 2]);
    expect($user->badges()->where('key', 'first_plan')->exists())->toBeTrue();
    $progress->update(['current_day' => 1]);
    expect($user->badges()->where('key', 'first_plan')->exists())->toBeTrue();
});

it('backfills every chapter milestone and the book badge from existing valid history', function () {
    $user = User::factory()->create();
    $rows = [];
    foreach (BibleCatalog::books() as $book) {
        foreach (range(1, $book['chapters']) as $chapter) {
            $rows[] = ['user_id' => $user->id, 'book' => $book['name'], 'chapter' => $chapter, 'read_on' => today()->toDateString(), 'translation' => 'web'];
        }
    }
    DB::table('reading_entries')->insert($rows);
    $badges = app(BadgeService::class)->forUser($user);
    expect(array_column($badges, 'key'))->toHaveCount(8)->toContain('chapters_1', 'chapters_10', 'chapters_50', 'chapters_100', 'chapters_250', 'chapters_500', 'chapters_1189', 'first_book');
    foreach ($badges as $badge) {
        expect(is_file(public_path(ltrim($badge['icon'], '/'))))->toBeTrue();
    }
});

it('only returns the signed in users awards and shows persistent earned state on reports', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $entry = logBadgeChapter($owner);
    $entry->delete();
    $this->actingAs($other)->get('/dashboard')->assertInertia(fn ($page) => $page->has('earnedBadges', 0));
    $this->actingAs($owner)->get('/dashboard')->assertInertia(fn ($page) => $page->has('earnedBadges', 1)->where('earnedBadges.0.key', 'chapters_1'));
    $this->get('/reports')->assertInertia(fn ($page) => $page->where('report.milestones.0.achieved', false)->where('report.milestones.0.earned', true));
});

it('starts with no awards for a new account', function () {
    $this->actingAs(User::factory()->create())->get('/dashboard')->assertInertia(fn ($page) => $page->has('earnedBadges', 0));
    expect(Badge::query()->count())->toBe(0);
});
