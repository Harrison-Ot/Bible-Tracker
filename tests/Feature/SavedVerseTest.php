<?php

use App\Models\SavedVerse;
use App\Models\User;
use Illuminate\Support\Facades\Http;

function savedVerseForReader(User $user, array $attributes = []): SavedVerse
{
    return $user->savedVerses()->create(array_replace([
        'book_id' => 'GEN', 'book' => 'Genesis', 'chapter' => 1, 'verse' => 1, 'translation' => 'web',
        'text' => 'In the beginning.', 'highlighted' => true, 'bookmarked' => false,
    ], $attributes));
}

function savedVerseCoordinates(array $attributes = []): array
{
    return array_replace(['book_id' => 'GEN', 'chapter' => 1, 'verse' => 1, 'translation' => 'web'], $attributes);
}

function fakeSavedVersePassage(): void
{
    Http::fake(['bible-api.com/*' => Http::response(['verses' => [
        ['book_id' => 'GEN', 'book_name' => 'Genesis', 'chapter' => 1, 'verse' => 1, 'text' => 'In the beginning.'],
        ['book_id' => 'GEN', 'book_name' => 'Genesis', 'chapter' => 1, 'verse' => 2, 'text' => 'And the earth was without form.'],
    ]])]);
}

beforeEach(function () {
    $this->withoutVite();
    Http::preventStrayRequests();
});

it('requires a verified account to view import save clear or delete saved verses', function () {
    $entry = savedVerseForReader(User::factory()->create());
    $this->get('/saved-verses')->assertRedirect('/login');
    $this->putJson('/saved-verses', [])->assertUnauthorized();
    $this->postJson('/saved-verses/import', [])->assertUnauthorized();
    $this->deleteJson('/saved-verses/highlights', [])->assertUnauthorized();
    $this->deleteJson('/saved-verses/'.$entry->id)->assertUnauthorized();
    $this->actingAs(User::factory()->unverified()->create())->putJson('/saved-verses', [])->assertForbidden();
});

it('starts with an empty private saved verse library', function () {
    savedVerseForReader(User::factory()->create());
    $this->actingAs(User::factory()->create())->get('/saved-verses')->assertOk()->assertInertia(fn ($page) => $page
        ->component('saved-verses')->where('verses.total', 0)->has('books', 66)->has('translations', 0));
});

it('saves canonical provider text only for the authenticated reader and deduplicates repeated saves', function () {
    fakeSavedVersePassage();
    $user = User::factory()->create();
    $other = User::factory()->create();
    $payload = [...savedVerseCoordinates(), 'highlighted' => true, 'text' => 'Forged text', 'user_id' => $other->id, 'book' => 'Forged book'];
    $this->actingAs($user)->putJson('/saved-verses', $payload)->assertOk()->assertJsonPath('savedVerse.text', 'In the beginning.')
        ->assertJsonPath('savedVerse.book', 'Genesis')->assertJsonPath('savedVerse.highlighted', true)->assertJsonPath('savedVerse.bookmarked', false);
    $this->putJson('/saved-verses', $payload)->assertOk();
    $this->assertDatabaseCount('saved_verses', 1);
    $this->assertDatabaseHas('saved_verses', ['user_id' => $user->id, 'text' => 'In the beginning.']);
    expect($other->savedVerses()->count())->toBe(0);
});

it('keeps bookmark and highlight independent and removes empty records', function () {
    fakeSavedVersePassage();
    $this->actingAs(User::factory()->create());
    $this->putJson('/saved-verses', [...savedVerseCoordinates(), 'highlighted' => true])->assertOk();
    $this->putJson('/saved-verses', [...savedVerseCoordinates(), 'bookmarked' => true])->assertJsonPath('savedVerse.highlighted', true)->assertJsonPath('savedVerse.bookmarked', true);
    $this->putJson('/saved-verses', [...savedVerseCoordinates(), 'highlighted' => false])->assertJsonPath('savedVerse.highlighted', false)->assertJsonPath('savedVerse.bookmarked', true);
    $this->putJson('/saved-verses', [...savedVerseCoordinates(), 'bookmarked' => false])->assertJsonPath('savedVerse', null);
    $this->assertDatabaseCount('saved_verses', 0);
});

it('keeps translations and accounts separate', function () {
    fakeSavedVersePassage();
    $user = User::factory()->create();
    $other = User::factory()->create();
    savedVerseForReader($other);
    $this->actingAs($user)->putJson('/saved-verses', [...savedVerseCoordinates(), 'highlighted' => true])->assertOk();
    $this->putJson('/saved-verses', [...savedVerseCoordinates(['translation' => 'kjv']), 'bookmarked' => true])->assertOk();
    expect($user->savedVerses()->count())->toBe(2)->and($other->savedVerses()->count())->toBe(1);
    $this->get('/bible/GEN/1?translation=kjv')->assertOk()->assertInertia(fn ($page) => $page
        ->has('savedVerses', 1)->where('savedVerses.0.translation', 'kjv')->where('savedVerses.0.bookmarked', true)->where('savedVerses.0.highlighted', false));
});

it('validates coordinates flags and actual verse availability', function () {
    fakeSavedVersePassage();
    $this->actingAs(User::factory()->create());
    $this->putJson('/saved-verses', [...savedVerseCoordinates(['book_id' => 'BAD']), 'highlighted' => true])->assertUnprocessable()->assertJsonValidationErrors('book_id');
    $this->putJson('/saved-verses', [...savedVerseCoordinates(['chapter' => 51]), 'highlighted' => true])->assertUnprocessable()->assertJsonValidationErrors('chapter');
    $this->putJson('/saved-verses', [...savedVerseCoordinates(['translation' => '../web']), 'highlighted' => true])->assertUnprocessable()->assertJsonValidationErrors('translation');
    $this->putJson('/saved-verses', savedVerseCoordinates())->assertUnprocessable()->assertJsonValidationErrors('verse');
    $this->putJson('/saved-verses', [...savedVerseCoordinates(), 'highlighted' => 'yes'])->assertUnprocessable()->assertJsonValidationErrors('highlighted');
    Http::assertNothingSent();
    $this->putJson('/saved-verses', [...savedVerseCoordinates(['verse' => 199]), 'highlighted' => true])->assertUnprocessable()->assertJsonValidationErrors('verse');
    $this->assertDatabaseCount('saved_verses', 0);
});

it('removes missing highlights idempotently without contacting the provider', function () {
    $this->actingAs(User::factory()->create())->putJson('/saved-verses', [...savedVerseCoordinates(), 'highlighted' => false])->assertOk()->assertJsonPath('savedVerse', null);
    Http::assertNothingSent();
    $this->assertDatabaseCount('saved_verses', 0);
});

it('does not save a verse when the Bible provider fails but allows changes to existing records', function () {
    Http::fake(['bible-api.com/*' => Http::response([], 503)]);
    $user = User::factory()->create();
    $entry = savedVerseForReader($user, ['bookmarked' => true]);
    $this->actingAs($user)->putJson('/saved-verses', [...savedVerseCoordinates(), 'highlighted' => false])->assertOk()->assertJsonPath('savedVerse.bookmarked', true);
    Http::assertNothingSent();
    $this->putJson('/saved-verses', [...savedVerseCoordinates(['verse' => 2]), 'highlighted' => true])->assertStatus(502);
    $this->assertDatabaseCount('saved_verses', 1);
    expect($entry->fresh()->highlighted)->toBeFalse();
});

it('imports duplicate device highlights once without clearing bookmarks', function () {
    fakeSavedVersePassage();
    $user = User::factory()->create();
    savedVerseForReader($user, ['highlighted' => false, 'bookmarked' => true]);
    $payload = ['book_id' => 'GEN', 'chapter' => 1, 'translation' => 'web', 'verses' => [1, 1, 2]];
    $this->actingAs($user)->postJson('/saved-verses/import', $payload)->assertOk()->assertJsonPath('imported', 2)->assertJsonCount(2, 'savedVerses');
    $this->postJson('/saved-verses/import', $payload)->assertOk()->assertJsonPath('imported', 0);
    $this->assertDatabaseCount('saved_verses', 2);
    expect($user->savedVerses()->where('verse', 1)->first()->bookmarked)->toBeTrue();
});

it('validates an entire imported chapter before changing any records', function () {
    fakeSavedVersePassage();
    $this->actingAs(User::factory()->create())->postJson('/saved-verses/import', [
        'book_id' => 'GEN', 'chapter' => 1, 'translation' => 'web', 'verses' => [1, 199],
    ])->assertUnprocessable()->assertJsonValidationErrors('verses');
    $this->assertDatabaseCount('saved_verses', 0);
    $this->postJson('/saved-verses/import', ['book_id' => 'GEN', 'chapter' => 1, 'translation' => 'web', 'verses' => []])->assertJsonValidationErrors('verses');
});

it('clears only the current readers chapter and translation while preserving bookmarks', function () {
    $user = User::factory()->create();
    $bookmarked = savedVerseForReader($user, ['bookmarked' => true]);
    $removed = savedVerseForReader($user, ['verse' => 2]);
    $otherChapter = savedVerseForReader($user, ['chapter' => 2]);
    $otherTranslation = savedVerseForReader($user, ['translation' => 'kjv']);
    $otherUser = savedVerseForReader(User::factory()->create());
    $this->actingAs($user)->deleteJson('/saved-verses/highlights', ['book_id' => 'GEN', 'chapter' => 1, 'translation' => 'web'])
        ->assertOk()->assertJsonCount(1, 'savedVerses')->assertJsonPath('savedVerses.0.bookmarked', true)->assertJsonPath('savedVerses.0.highlighted', false);
    expect($removed->fresh())->toBeNull()->and($bookmarked->fresh()->bookmarked)->toBeTrue()
        ->and($otherChapter->fresh()->highlighted)->toBeTrue()->and($otherTranslation->fresh()->highlighted)->toBeTrue()->and($otherUser->fresh()->highlighted)->toBeTrue();
    Http::assertNothingSent();
});

it('prevents deletion of another readers verse', function () {
    $owner = User::factory()->create();
    $entry = savedVerseForReader($owner);
    $this->actingAs(User::factory()->create())->deleteJson('/saved-verses/'.$entry->id)->assertForbidden();
    expect($entry->fresh())->not->toBeNull();
    $this->actingAs($owner)->deleteJson('/saved-verses/'.$entry->id)->assertOk();
    expect($entry->fresh())->toBeNull();
});

it('searches exact passage references and combines private library filters', function () {
    $user = User::factory()->create();
    $entry = savedVerseForReader($user, ['book_id' => 'JHN', 'book' => 'John', 'chapter' => 3, 'verse' => 16, 'translation' => 'kjv', 'bookmarked' => true, 'text' => 'For God so loved the world.']);
    savedVerseForReader(User::factory()->create(), ['book_id' => 'JHN', 'book' => 'John', 'chapter' => 3, 'verse' => 16, 'translation' => 'kjv', 'bookmarked' => true]);
    savedVerseForReader($user);
    $this->actingAs($user)->get('/saved-verses?q=John+3%3A16&book=JHN&kind=bookmarked&translation=kjv')->assertInertia(fn ($page) => $page
        ->where('verses.total', 1)->where('verses.data.0.id', $entry->id)
        ->where('verses.data.0.url', fn ($url) => str_contains($url, '/bible/JHN/3?translation=kjv#verse-16')));
    $this->get('/saved-verses?q=loved')->assertInertia(fn ($page) => $page->where('verses.total', 1)->where('verses.data.0.id', $entry->id));
});

it('keeps filters during library pagination and treats search wildcards literally', function () {
    $user = User::factory()->create();
    foreach (range(1, 14) as $verse) {
        savedVerseForReader($user, ['verse' => $verse, 'text' => $verse === 1 ? '100% hope' : 'A word of hope']);
    }
    $this->actingAs($user)->get('/saved-verses?q=hope&kind=highlighted')->assertInertia(fn ($page) => $page
        ->has('verses.data', 12)->where('verses.total', 14)
        ->where('verses.next_page_url', fn ($url) => str_contains($url, 'q=hope') && str_contains($url, 'kind=highlighted')));
    $this->get('/saved-verses?q=hope&kind=highlighted&page=2')->assertInertia(fn ($page) => $page->has('verses.data', 2));
    $this->get('/saved-verses?q=%25')->assertInertia(fn ($page) => $page->where('verses.total', 1));
    $this->get('/saved-verses?kind=unknown')->assertSessionHasErrors('kind');
});

it('removes saved verses when their account is deleted', function () {
    $user = User::factory()->create();
    savedVerseForReader($user);
    $user->delete();
    $this->assertDatabaseCount('saved_verses', 0);
});
