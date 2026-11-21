<?php

use App\Models\User;
use App\Services\ReadingMusic;
use Illuminate\Support\Facades\Http;

test('plan passage links resolve book names to the Bible provider ids', function () {
    Http::fake([
        'bible-api.com/data/web' => Http::response([
            'books' => [
                ['id' => 'GEN', 'name' => 'Genesis'],
            ],
        ]),
        'bible-api.com/data/web/GEN/1' => Http::response([
            'reference' => 'Genesis 1',
            'verses' => [
                ['book_id' => 'GEN', 'book_name' => 'Genesis', 'chapter' => 1, 'verse' => 1, 'text' => 'In the beginning...'],
            ],
        ]),
    ]);

    $this->actingAs(User::factory()->create())
        ->get(route('bible.show', ['bookId' => 'Genesis', 'chapter' => 1]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('read')
            ->where('bookId', 'GEN')
            ->where('chapter', 1)
            ->where('passage.reference', 'Genesis 1')
        );
});

test('chapter navigation has a known final chapter', function () {
    Http::fake(['bible-api.com/*' => Http::response(['verses' => []])]);
    $this->actingAs(User::factory()->create())->get('/bible/JUD/1')
        ->assertOk()->assertInertia(fn ($page) => $page->where('chapterCount', 1));
});

test('invalid chapters are rejected before calling the provider', function () {
    Http::fake();
    $this->actingAs(User::factory()->create())->get('/bible/JUD/2')->assertNotFound();
    Http::assertNothingSent();
});

test('malformed translation query is rejected without calling the provider', function () {
    Http::fake();
    $this->actingAs(User::factory()->create())->get('/bible?translation[]=web')->assertSessionHasErrors('translation');
    Http::assertNothingSent();
});

test('reader receives the server managed music library', function () {
    Http::fake(['bible-api.com/*' => Http::response(['verses' => []])]);
    $songs = [['id' => 'grace.mp3', 'title' => 'Grace', 'url' => '/songs/grace.mp3']];
    $this->mock(ReadingMusic::class)->shouldReceive('songs')->once()->andReturn($songs);
    $this->actingAs(User::factory()->create())->get('/bible/JUD/1')
        ->assertOk()->assertInertia(fn ($page) => $page->where('songs', $songs));
});
