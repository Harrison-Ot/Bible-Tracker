<?php


namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
});

it('returns reading counts keyed by date for the authenticated user', function () {
    $user = User::factory()->create();

    $user->readingEntries()->create(['read_on' => today(), 'book' => 'John', 'chapter' => 1]);
    $user->readingEntries()->create(['read_on' => today(), 'book' => 'John', 'chapter' => 2]);
    $user->readingEntries()->create(['read_on' => today()->subDay(), 'book' => 'John', 'chapter' => 3]);

    $response = $this->actingAs($user)->get('/dashboard');

    $response->assertInertia(fn ($page) => $page
        ->component('dashboard')
        ->where('readingCounts.' . today()->format('Y-m-d'), 2)
        ->where('readingCounts.' . today()->subDay()->format('Y-m-d'), 1)
        ->where('currentStreak', 2)
    );
});
it('does not show another user\'s reading entries on the dashboard', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();

    $other->readingEntries()->create(['read_on' => today(), 'book' => 'John', 'chapter' => 1]);

    $response = $this->actingAs($user)->get('/dashboard');

    $response->assertInertia(fn ($page) => $page
        ->where('readingCounts.' . today()->format('Y-m-d'), null)
    );
});