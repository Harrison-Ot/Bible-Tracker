<?php

use App\Models\ConnectionRequest;
use App\Models\User;
use Illuminate\Support\Facades\Notification;

test('guests are redirected away from members and notifications', function () {
    $this->get(route('members.index'))->assertRedirect(route('login'));
    $this->get(route('notifications.index'))->assertRedirect(route('login'));
});

test('members can browse verified users without seeing themselves or unverified users', function () {
    $member = User::factory()->create(['name' => 'Community Member']);
    $other = User::factory()->create(['name' => 'Another Reader']);
    $unverified = User::factory()->unverified()->create(['name' => 'Unverified Reader']);

    $this->actingAs($member)->get(route('members.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('members/index')
            ->has('members.data', 1)
            ->where('members.data.0.id', $other->id)
            ->where('members.data.0.connectionStatus', 'none')
            ->missing('members.data.1')
            ->missing('members.data.0.email')
        );

    expect($unverified->email_verified_at)->toBeNull();
});

test('member can send a connection request and recipient receives an in-app notification', function () {
    Notification::fake();
    $sender = User::factory()->create();
    $recipient = User::factory()->create();

    $this->actingAs($sender)->post(route('connections.store', $recipient))->assertRedirect();

    $connection = ConnectionRequest::query()->sole();
    expect($connection->sender_id)->toBe($sender->id)
        ->and($connection->recipient_id)->toBe($recipient->id)
        ->and($connection->status)->toBe('pending');

    Notification::assertSentTo($recipient, \App\Notifications\ConnectionRequestNotification::class);
});

test('members cannot send a connection request to themselves', function () {
    $member = User::factory()->create();

    $this->actingAs($member)->post(route('connections.store', $member))->assertUnprocessable();

    expect(ConnectionRequest::query()->count())->toBe(0);
});

test('members can accept a request and requester is notified', function () {
    Notification::fake();
    $sender = User::factory()->create();
    $recipient = User::factory()->create();
    $connectionRequest = ConnectionRequest::query()->create([
        'sender_id' => $sender->id,
        'recipient_id' => $recipient->id,
        'status' => 'pending',
    ]);

    $this->actingAs($recipient)->patch(route('connections.update', $connectionRequest), ['status' => 'accepted'])
        ->assertRedirect();

    expect($connectionRequest->fresh()->status)->toBe('accepted');
    Notification::assertSentTo($sender, \App\Notifications\ConnectionRequestNotification::class);
});

test('members cannot respond to another users connection request', function () {
    $sender = User::factory()->create();
    $recipient = User::factory()->create();
    $intruder = User::factory()->create();
    $connectionRequest = ConnectionRequest::query()->create([
        'sender_id' => $sender->id,
        'recipient_id' => $recipient->id,
        'status' => 'pending',
    ]);

    $this->actingAs($intruder)->patch(route('connections.update', $connectionRequest), ['status' => 'accepted'])
        ->assertForbidden();

    expect($connectionRequest->fresh()->status)->toBe('pending');
});

test('notification inbox is scoped to its owner and can mark a notification as read', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $userNotification = $user->notifications()->create([
        'id' => (string) str()->uuid(),
        'type' => 'test',
        'data' => ['message' => 'Your request arrived.'],
    ]);
    $otherNotification = $other->notifications()->create([
        'id' => (string) str()->uuid(),
        'type' => 'test',
        'data' => ['message' => 'Private notification.'],
    ]);

    $this->actingAs($user)->get(route('notifications.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('notifications/index')
            ->where('unreadCount', 1)
            ->has('notifications.data', 1)
            ->where('notifications.data.0.id', $userNotification->id)
        );

    $this->actingAs($user)->patch(route('notifications.read', $userNotification->id))->assertRedirect();

    expect($userNotification->fresh()->read_at)->not->toBeNull()
        ->and($otherNotification->fresh()->read_at)->toBeNull();
});