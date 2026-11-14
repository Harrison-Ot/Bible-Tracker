<?php

use App\Models\ReadingEntry;
use App\Models\ReadingPlan;
use App\Models\User;
use App\Models\UserPlanProgress;
use Illuminate\Support\Facades\Http;

it('requires authentication for journal browsing and reflection editing', function () {
    $entry = ReadingEntry::factory()->create();
    $this->get('/journal')->assertRedirect('/login');
    $this->patch("/reading-entries/{$entry->id}", ['note' => 'Changed'])->assertRedirect('/login');
});

it('searches passages and notes only within the authenticated users journal', function () {
    $user = User::factory()->create();
    $entry = ReadingEntry::factory()->for($user)->create(['book' => 'John', 'chapter' => 3, 'note' => 'Hope in the promise']);
    ReadingEntry::factory()->for($user)->create(['book' => 'John', 'chapter' => 4, 'note' => 'A different reflection']);
    ReadingEntry::factory()->create(['book' => 'John', 'chapter' => 3, 'note' => 'Hope in the promise']);
    $this->actingAs($user)->get('/journal?q=John+3')->assertInertia(fn ($page) => $page
        ->component('reading-journal')->where('readings.total', 1)->where('readings.data.0.id', $entry->id));
    $this->get('/journal?q=promise')->assertInertia(fn ($page) => $page
        ->where('readings.total', 1)->where('readings.data.0.id', $entry->id));
});

it('combines journal filters and preserves them in pagination', function () {
    $user = User::factory()->create();
    ReadingEntry::factory()->for($user)->count(12)->create(['book' => 'John', 'read_on' => '2026-01-15', 'note' => 'Faith']);
    ReadingEntry::factory()->for($user)->create(['book' => 'Mark', 'read_on' => '2026-01-15', 'note' => 'Faith']);
    ReadingEntry::factory()->for($user)->create(['book' => 'John', 'read_on' => '2025-12-31', 'note' => 'Faith']);
    $query = 'q=Faith&book=John&from=2026-01-01&to=2026-01-31';
    $this->actingAs($user)->get('/journal?'.$query)->assertInertia(fn ($page) => $page
        ->where('readings.total', 12)->has('readings.data', 10)
        ->where('readings.next_page_url', fn ($url) => str_contains($url, 'q=Faith') && str_contains($url, 'book=John') && str_contains($url, 'from=2026-01-01') && str_contains($url, 'to=2026-01-31')));
    $this->get('/journal?'.$query.'&page=2')->assertInertia(fn ($page) => $page->has('readings.data', 2));
});

it('treats SQL wildcard characters as literal journal search text', function () {
    $user = User::factory()->create();
    ReadingEntry::factory()->for($user)->create(['note' => '100% committed']);
    ReadingEntry::factory()->for($user)->create(['note' => 'Ordinary reflection']);
    $this->actingAs($user)->get('/journal?q=%25')->assertInertia(fn ($page) => $page->where('readings.total', 1));
});

it('validates journal filters', function () {
    $this->actingAs(User::factory()->create());
    $this->get('/journal?book=Unknown')->assertSessionHasErrors('book');
    $this->get('/journal?from=2026-02-01&to=2026-01-01')->assertSessionHasErrors('to');
    $this->get('/journal?q[]=bad')->assertSessionHasErrors('q');
    $this->get('/journal?from=not-a-date')->assertSessionHasErrors('from');
});

it('edits only a reflection and preserves the passage and reading date', function () {
    $user = User::factory()->create();
    $entry = ReadingEntry::factory()->for($user)->create(['book' => 'John', 'chapter' => 3, 'note' => 'Original']);
    $date = $entry->read_on->toDateString();
    $this->actingAs($user)->from('/journal?q=John')->patch("/reading-entries/{$entry->id}", [
        'note' => 'A new reflection', 'book' => 'Mark', 'chapter' => 1,
    ])->assertRedirect('/journal?q=John')->assertSessionHasNoErrors();
    expect($entry->fresh()->note)->toBe('A new reflection')
        ->and($entry->fresh()->book)->toBe('John')->and($entry->fresh()->chapter)->toBe(3)
        ->and($entry->fresh()->read_on->toDateString())->toBe($date);
    $this->patch("/reading-entries/{$entry->id}", ['note' => ''])->assertSessionHasNoErrors();
    expect($entry->fresh()->note)->toBeNull();
});

it('rejects reflection changes by other users and validates the note', function () {
    $entry = ReadingEntry::factory()->create(['note' => 'Private']);
    $this->actingAs(User::factory()->create())->patch("/reading-entries/{$entry->id}", ['note' => 'Intrusion'])->assertForbidden();
    $this->actingAs($entry->user)->patch("/reading-entries/{$entry->id}", ['note' => str_repeat('x', 1001)])->assertSessionHasErrors('note');
    $this->patch("/reading-entries/{$entry->id}", [])->assertSessionHasErrors('note');
    expect($entry->fresh()->note)->toBe('Private');
});

it('remembers a loaded chapter and translation without logging a reading', function () {
    Http::fake(['bible-api.com/*' => Http::response(['verses' => [
        ['book_id' => 'JHN', 'book_name' => 'John', 'chapter' => 3, 'verse' => 1, 'text' => 'Test passage'],
    ]])]);
    $user = User::factory()->create();
    $other = User::factory()->create();
    $this->actingAs($user)->get('/bible/JHN/3?translation=kjv')->assertOk();
    $this->assertDatabaseCount('reading_entries', 0);
    $this->get('/dashboard')->assertInertia(fn ($page) => $page
        ->where('lastReading.bookId', 'JHN')->where('lastReading.chapter', 3)->where('lastReading.translation', 'kjv'));
    $this->actingAs($other)->get('/dashboard')->assertInertia(fn ($page) => $page->where('lastReading', null));
    $this->actingAs($user->fresh())->get('/dashboard')->assertInertia(fn ($page) => $page->where('lastReading.translation', 'kjv'));
});

it('does not move the reading position for empty failed or prefetched passages', function () {
    $saved = ['bookId' => 'GEN', 'book' => 'Genesis', 'chapter' => 1, 'translation' => 'web'];
    $user = User::factory()->create();
    $user->forceFill(['last_reading' => $saved])->save();
    $this->actingAs($user);
    Http::fake(['bible-api.com/*' => Http::sequence()
        ->push(['verses' => []])
        ->push([], 503)
        ->push(['verses' => [['text' => 'Passage']]])]);
    $this->get('/bible/JHN/2')->assertOk();
    $this->get('/bible/JHN/3')->assertStatus(502);
    $this->withHeader('Purpose', 'prefetch')->get('/bible/JHN/4')->assertOk();
    expect($user->fresh()->last_reading)->toBe($saved);
});

it('uses the latest valid logged passage as a reading position fallback', function () {
    $user = User::factory()->create();
    ReadingEntry::factory()->for($user)->create(['book' => 'John', 'chapter' => 3, 'translation' => 'kjv', 'read_on' => today()]);
    ReadingEntry::factory()->for($user)->create(['book' => 'Mark', 'chapter' => 1, 'read_on' => today()->addDay()]);
    $this->actingAs($user)->get('/dashboard')->assertInertia(fn ($page) => $page
        ->where('lastReading.bookId', 'JHN')->where('lastReading.translation', 'kjv'));
});

it('shows only the users active plans and counts distinct chapters read today', function () {
    $user = User::factory()->create();
    $plan = ReadingPlan::query()->create(['name' => 'Daily Gospels', 'slug' => 'daily-gospels', 'duration_days' => 30]);
    UserPlanProgress::query()->create(['user_id' => $user->id, 'reading_plan_id' => $plan->id, 'current_day' => 2, 'started_on' => today()]);
    $otherPlan = ReadingPlan::query()->create(['name' => 'Finished', 'slug' => 'finished', 'duration_days' => 1]);
    UserPlanProgress::query()->create(['user_id' => $user->id, 'reading_plan_id' => $otherPlan->id, 'current_day' => 2, 'started_on' => today()]);
    ReadingEntry::factory()->for($user)->count(2)->create(['book' => 'John', 'chapter' => 1, 'read_on' => today()]);
    ReadingEntry::factory()->create(['book' => 'John', 'chapter' => 2, 'read_on' => today()]);
    $this->actingAs($user)->get('/dashboard')->assertInertia(fn ($page) => $page
        ->has('activePlans', 1)->where('activePlans.0.name', 'Daily Gospels')->where('activePlans.0.currentDay', 2)->where('chaptersToday', 1));
});
