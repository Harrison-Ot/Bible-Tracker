<?php

use App\Models\User;
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
