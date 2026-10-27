<?php

use App\Models\ChatMessage;
use App\Models\ConnectionRequest;
use App\Models\User;

function connectUsers(User $sender, User $recipient, string $status = 'accepted'): ConnectionRequest
{
    return ConnectionRequest::query()->create([
        'sender_id' => $sender->id,
        'recipient_id' => $recipient->id,
        'status' => $status,
    ]);
}

test('guests are redirected away from chats', function () {
    $this->get(route('chats.index'))->assertRedirect(route('login'));
});

test('chat inbox only lists accepted connections and their private conversation', function () {
    $user = User::factory()->create();
    $connected = User::factory()->create(['name' => 'Connected Reader']);
    $pending = User::factory()->create(['name' => 'Pending Reader']);
    $stranger = User::factory()->create(['name' => 'Unconnected Reader']);

    connectUsers($connected, $user);
    connectUsers($user, $pending, 'pending');

    $message = ChatMessage::query()->create([
        'sender_id' => $connected->id,
        'recipient_id' => $user->id,
        'body' => 'Peace be with you.',
    ]);
    ChatMessage::query()->create([
        'sender_id' => $stranger->id,
        'recipient_id' => $user->id,
        'body' => 'Private message from an unconnected user.',
    ]);

    $this->actingAs($user)->get(route('chats.index', ['with' => $connected->id]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('chats/index')
            ->has('connections', 1)
            ->where('connections.0.id', $connected->id)
            ->where('selectedConnectionId', $connected->id)
            ->has('messages', 1)
            ->where('messages.0.id', $message->id)
            ->where('messages.0.body', 'Peace be with you.')
        );

    $this->actingAs($user)->get(route('chats.index', ['with' => $stranger->id]))
        ->assertInertia(fn ($page) => $page
            ->where('selectedConnectionId', null)
            ->has('messages', 0)
        );
});

test('connected users can send a message', function () {
    $sender = User::factory()->create();
    $recipient = User::factory()->create();
    connectUsers($sender, $recipient);

    $this->actingAs($sender)
        ->post(route('chats.messages.store', $recipient), ['body' => 'Hello there!'])
        ->assertRedirect(route('chats.index', ['with' => $recipient->id]));

    $message = ChatMessage::query()->sole();
    expect($message->sender_id)->toBe($sender->id)
        ->and($message->recipient_id)->toBe($recipient->id)
        ->and($message->body)->toBe('Hello there!');
});

test('users cannot read or send messages with non-connections', function () {
    $user = User::factory()->create();
    $stranger = User::factory()->create();

    $this->actingAs($user)
        ->post(route('chats.messages.store', $stranger), ['body' => 'Hello'])
        ->assertNotFound();

    expect(ChatMessage::query()->count())->toBe(0);
});

test('chat messages must contain non-empty text within the allowed length', function () {
    $sender = User::factory()->create();
    $recipient = User::factory()->create();
    connectUsers($sender, $recipient);

    $this->actingAs($sender)
        ->post(route('chats.messages.store', $recipient), ['body' => ''])
        ->assertSessionHasErrors('body');

    $this->actingAs($sender)
        ->post(route('chats.messages.store', $recipient), ['body' => str_repeat('x', 2001)])
        ->assertSessionHasErrors('body');

    expect(ChatMessage::query()->count())->toBe(0);
});
