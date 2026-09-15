<?php

use App\Models\ReadingEntry;
use App\Models\User;

it('lets an authenticated user log a reading entry', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post('/reading-entries', [
        'book' => 'John',
        'chapter' => 3,
        'translation' => 'web',
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('reading_entries', [
        'user_id' => $user->id,
        'book' => 'John',
        'chapter' => 3,
        'read_on' => today()->toDateString(),
    ]);
});

it('rejects a reading entry with an invalid chapter', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post('/reading-entries', [
        'book' => 'John',
        'chapter' => 0,
    ]);

    $response->assertSessionHasErrors('chapter');
    $this->assertDatabaseCount('reading_entries', 0);
});

it('requires authentication to log a reading entry', function () {
    $response = $this->post('/reading-entries', [
        'book' => 'John',
        'chapter' => 3,
    ]);

    $response->assertRedirect('/login');
});

it('lets a user delete their own reading entry', function () {
    $user = User::factory()->create();
    $entry = ReadingEntry::factory()->for($user)->create();

    $response = $this->actingAs($user)->delete("/reading-entries/{$entry->id}");

    $response->assertRedirect();
    $this->assertDatabaseMissing('reading_entries', ['id' => $entry->id]);
});

it('prevents a user from deleting someone else\'s reading entry', function () {
    $owner = User::factory()->create();
    $intruder = User::factory()->create();
    $entry = ReadingEntry::factory()->for($owner)->create();

    $response = $this->actingAs($intruder)->delete("/reading-entries/{$entry->id}");

    $response->assertForbidden();
    $this->assertDatabaseHas('reading_entries', ['id' => $entry->id]);
});