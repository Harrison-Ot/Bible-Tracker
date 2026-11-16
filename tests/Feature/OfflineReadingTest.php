<?php

use App\Models\ReadingEntry;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

function offlineProviderChapter(array $overrides = []): array
{
    return array_replace(['translation' => ['identifier' => 'web', 'license' => 'Public Domain'], 'verses' => [
        ['book_id' => 'GEN', 'book' => 'Genesis', 'chapter' => 1, 'verse' => 1, 'text' => 'In the beginning God created the heavens and the earth.'],
        ['book_id' => 'GEN', 'book' => 'Genesis', 'chapter' => 1, 'verse' => 2, 'text' => 'The earth was formless and empty.'],
    ]], $overrides);
}
function offlineLog(User $owner, array $overrides = []): array
{
    return array_replace(['client_id' => (string) Str::uuid(), 'owner_id' => $owner->id, 'book_id' => 'GEN', 'chapter' => 1, 'translation' => 'web', 'read_on' => '2026-11-15'], $overrides);
}
beforeEach(function () {
    $this->withoutVite();
    $this->travelTo(Carbon::parse('2026-11-16 09:00:00', 'UTC'));
    Cache::flush();
    Http::preventStrayRequests();
});
afterEach(function () {
    $this->travelBack();
});

it('requires verified authentication for downloads and synchronization', function () {
    $this->get('/downloads')->assertRedirect('/login');
    $this->getJson('/offline-passages/GEN/1')->assertUnauthorized();
    $this->postJson('/offline-readings')->assertUnauthorized();
    $this->actingAs(User::factory()->unverified()->create())->get('/downloads')->assertRedirect('/email/verify');
    $this->getJson('/offline-passages/GEN/1')->assertForbidden();
    $this->postJson('/offline-readings')->assertForbidden();
});

it('renders a public offline shell without embedding private account or csrf data', function () {
    $user = User::factory()->create();
    $this->actingAs($user)->get('/offline')->assertOk()->assertSee('id="offline-app"', false)->assertDontSee($user->email)->assertDontSee($user->name)->assertDontSee('csrf-token')->assertDontSee('data-page');
    $this->get('/downloads')->assertInertia(fn ($page) => $page->component('downloads')->has('books', 66));
});

it('returns validated WEB chapter text and licensing metadata without account data', function () {
    Http::fake(['bible-api.com/*' => Http::response(offlineProviderChapter(['untrusted' => 'Do not store this']))]);
    $user = User::factory()->create();
    $response = $this->actingAs($user)->getJson('/offline-passages/GEN/1?translation=web');
    $response->assertOk()->assertHeader('Cache-Control', 'no-store, private')->assertJsonPath('bookId', 'GEN')->assertJsonPath('bookName', 'Genesis')->assertJsonPath('translation', 'web')->assertJsonPath('license', 'Public Domain')->assertJsonCount(2, 'verses')->assertJsonMissingPath('untrusted')->assertJsonMissingPath('auth')->assertJsonMissingPath('verses.0.book_id');
    $this->getJson('/offline-passages/GEN/1')->assertOk();
    Http::assertSentCount(1);
    Http::assertSent(fn ($request) => $request->url() === 'https://bible-api.com/data/web/GEN/1');
    $this->assertDatabaseCount('reading_entries', 0);
});

it('rejects unsupported translations and invalid canonical passages before provider requests', function () {
    $this->actingAs(User::factory()->create());
    $this->getJson('/offline-passages/GEN/1?translation=kjv')->assertUnprocessable();
    foreach (['bogus/1', 'GEN/51', 'JUD/2', 'GEN/0'] as $path) {
        $this->getJson('/offline-passages/'.$path)->assertNotFound();
    }
    Http::assertNothingSent();
});

it('rejects unverified licensing metadata and malformed or mismatched verse sequences', function () {
    $this->actingAs(User::factory()->create());
    $valid = offlineProviderChapter();
    $bad = [
        ['translation' => ['identifier' => 'kjv', 'license' => 'Public Domain']],
        ['translation' => ['identifier' => 'web', 'license' => 'Copyright']],
        ['verses' => []],
        ['verses' => [array_replace($valid['verses'][0], ['book_id' => 'EXO'])]],
        ['verses' => [array_replace($valid['verses'][0], ['chapter' => 2])]],
        ['verses' => [array_replace($valid['verses'][0], ['verse' => 2])]],
        ['verses' => [array_replace($valid['verses'][0], ['text' => '   '])]],
    ];
    foreach ($bad as $overrides) {
        Cache::forget('bible:web:GEN:1');
        Http::fake(['bible-api.com/*' => Http::response(offlineProviderChapter($overrides))]);
        $this->getJson('/offline-passages/GEN/1')->assertStatus(502);
    }
});

it('handles provider outages without claiming a passage is downloadable', function () {
    Http::fake(['bible-api.com/*' => Http::response([], 503)]);
    $this->actingAs(User::factory()->create())->getJson('/offline-passages/GEN/1')->assertStatus(502);
    $this->assertDatabaseCount('reading_entries', 0);
});

it('rate limits chapter downloads', function () {
    Http::fake(['bible-api.com/*' => Http::response(offlineProviderChapter())]);
    $this->actingAs(User::factory()->create());
    foreach (range(1, 10) as $attempt) {
        $this->getJson('/offline-passages/GEN/1')->assertOk();
    }
    $this->getJson('/offline-passages/GEN/1')->assertTooManyRequests();
    Http::assertSentCount(1);
});

it('saves a queued reading on its original date once and acknowledges exact retries', function () {
    $owner = User::factory()->create();
    $payload = offlineLog($owner, ['user_id' => 999, 'note' => 'Client notes must not be imported']);
    $this->actingAs($owner)->postJson('/offline-readings', $payload)->assertOk()->assertJsonPath('status', 'synced')->assertJsonPath('client_id', $payload['client_id']);
    $this->postJson('/offline-readings', $payload)->assertOk()->assertJsonPath('status', 'already_synced');
    $entry = ReadingEntry::query()->sole();
    expect($entry->user_id)->toBe($owner->id)->and($entry->book)->toBe('Genesis')->and($entry->read_on->toDateString())->toBe('2026-11-15')->and($entry->note)->toBeNull();
    $this->assertDatabaseCount('offline_reading_receipts', 1);
    $this->assertDatabaseCount('user_plan_progress', 0);
    $this->assertDatabaseCount('group_reading_checkins', 0);
});

it('never replays a deleted confirmed reading after a lost response', function () {
    $user = User::factory()->create();
    $payload = offlineLog($user);
    $this->actingAs($user)->postJson('/offline-readings', $payload)->assertOk();
    ReadingEntry::query()->sole()->delete();
    $this->postJson('/offline-readings', $payload)->assertOk()->assertJsonPath('status', 'already_synced');
    $this->assertDatabaseCount('reading_entries', 0);
    $this->assertDatabaseHas('offline_reading_receipts', ['user_id' => $user->id, 'client_id' => $payload['client_id'], 'reading_entry_id' => null]);
});

it('rejects changed payloads for an acknowledged operation token', function () {
    $user = User::factory()->create();
    $payload = offlineLog($user);
    $this->actingAs($user)->postJson('/offline-readings', $payload)->assertOk();
    $this->postJson('/offline-readings', array_replace($payload, ['chapter' => 2]))->assertConflict();
    $this->assertDatabaseCount('reading_entries', 1);
    expect(ReadingEntry::query()->sole()->chapter)->toBe(1);
});

it('rejects a queued operation presented under a different signed-in account', function () {
    [$owner, $other] = User::factory()->count(2)->create()->all();
    $payload = offlineLog($owner);
    $this->actingAs($other)->postJson('/offline-readings', $payload)->assertForbidden();
    $this->assertDatabaseCount('reading_entries', 0);
    $this->assertDatabaseCount('offline_reading_receipts', 0);
    $this->actingAs($owner)->postJson('/offline-readings', $payload)->assertOk();
    $this->actingAs($other)->postJson('/offline-readings', $payload)->assertForbidden();
    $this->assertDatabaseCount('reading_entries', 1);
});

it('reconciles different device tokens for the same chapter and date while retaining distinct dates', function () {
    $user = User::factory()->create();
    $this->actingAs($user)->postJson('/offline-readings', offlineLog($user))->assertOk();
    $this->postJson('/offline-readings', offlineLog($user))->assertOk();
    $this->assertDatabaseCount('reading_entries', 1);
    $this->assertDatabaseCount('offline_reading_receipts', 2);
    $this->postJson('/offline-readings', offlineLog($user, ['read_on' => '2026-11-16']))->assertOk();
    $this->assertDatabaseCount('reading_entries', 2);
});

it('reconciles an existing online entry without overwriting its reflection or another translation', function () {
    $user = User::factory()->create();
    $existing = $user->readingEntries()->create(['book' => 'GEN', 'chapter' => 1, 'translation' => 'web', 'read_on' => '2026-11-15', 'note' => 'A private reflection']);
    $user->readingEntries()->create(['book' => 'Genesis', 'chapter' => 1, 'translation' => 'kjv', 'read_on' => '2026-11-15']);
    $payload = offlineLog($user);
    $this->actingAs($user)->postJson('/offline-readings', $payload)->assertOk();
    $this->assertDatabaseCount('reading_entries', 2);
    expect($existing->fresh()->note)->toBe('A private reflection');
    $this->assertDatabaseHas('offline_reading_receipts', ['client_id' => $payload['client_id'], 'reading_entry_id' => $existing->id]);
});

it('validates queued ids dates books bounds and the permitted translation atomically', function () {
    $user = User::factory()->create();
    $this->actingAs($user);
    foreach ([['client_id' => 'bad'], ['owner_id' => 'bad'], ['book_id' => 'Genesis'], ['book_id' => 'JUD', 'chapter' => 2], ['chapter' => 0], ['chapter' => 151], ['translation' => 'kjv'], ['read_on' => '2026-11-17'], ['read_on' => '2026-02-30'], ['read_on' => 'yesterday']] as $bad) {
        $this->postJson('/offline-readings', offlineLog($user, $bad))->assertUnprocessable();
    }
    $this->assertDatabaseCount('reading_entries', 0);
    $this->assertDatabaseCount('offline_reading_receipts', 0);
});

it('keeps receipts account scoped and removes them with the owning account', function () {
    [$first, $second] = User::factory()->count(2)->create()->all();
    $payload = offlineLog($first);
    $this->actingAs($first)->postJson('/offline-readings', $payload)->assertOk();
    $this->actingAs($second)->postJson('/offline-readings', array_replace($payload, ['owner_id' => $second->id]))->assertOk();
    $first->delete();
    $this->assertDatabaseCount('offline_reading_receipts', 1);
    $this->assertDatabaseCount('reading_entries', 1);
    expect(DB::table('offline_reading_receipts')->sole()->user_id)->toBe($second->id);
});
