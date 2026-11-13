<?php

use App\Models\ReadingEntry;
use App\Models\User;

it('paginates only the signed in users journal and supplies all Bible books', function () {
    $user = User::factory()->create();
    ReadingEntry::factory()->for($user)->count(12)->create();
    $other = ReadingEntry::factory()->create(['note' => 'Private reflection']);
    $this->actingAs($user)->get('/dashboard')->assertInertia(fn ($page) => $page
        ->has('books', 66)->has('recentReadings.data', 10)->where('recentReadings.total', 12)
        ->where('recentReadings.data', fn ($entries) => collect($entries)->every(fn ($entry) => $entry['id'] !== $other->id))
    );
    $this->get('/dashboard?page=2')->assertInertia(fn ($page) => $page->has('recentReadings.data', 2));
});
