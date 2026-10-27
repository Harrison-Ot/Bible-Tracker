<?php

namespace App\Http\Controllers;

use App\Models\ChatMessage;
use App\Models\ConnectionRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ChatController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $connectedIds = ConnectionRequest::query()
            ->where('status', 'accepted')
            ->where(fn ($query) => $query
                ->where('sender_id', $user->id)
                ->orWhere('recipient_id', $user->id))
            ->get(['sender_id', 'recipient_id'])
            ->map(fn (ConnectionRequest $connection): int => $connection->sender_id === $user->id
                ? $connection->recipient_id
                : $connection->sender_id)
            ->unique()
            ->values();

        $connections = User::query()
            ->whereIn('id', $connectedIds)
            ->orderBy('name')
            ->get(['id', 'name', 'avatar_path']);

        $selectedId = $request->integer('with') ?: null;
        $selected = $selectedId ? $connections->firstWhere('id', $selectedId) : null;
        $messages = collect();

        if ($selected) {
            $messages = $this->conversation($user->id, $selected->id)
                ->with('sender:id,name')
                ->latest('id')
                ->limit(100)
                ->get()
                ->reverse()
                ->values()
                ->map(fn (ChatMessage $message): array => [
                    'id' => $message->id,
                    'senderId' => $message->sender_id,
                    'senderName' => $message->sender->name,
                    'body' => $message->body,
                    'sentAt' => $message->created_at->toIso8601String(),
                ]);
        }

        return Inertia::render('chats/index', [
            'connections' => $connections->map(fn (User $connection): array => [
                'id' => $connection->id,
                'name' => $connection->name,
                'avatarUrl' => $connection->avatar_url,
            ]),
            'selectedConnectionId' => $selected?->id,
            'messages' => $messages,
        ]);
    }

    public function store(Request $request, User $user): RedirectResponse
    {
        abort_unless($this->isConnected($request->user()->id, $user->id), 404);

        $validated = $request->validate([
            'body' => ['required', 'string', 'max:2000'],
        ]);

        ChatMessage::query()->create([
            'sender_id' => $request->user()->id,
            'recipient_id' => $user->id,
            'body' => $validated['body'],
        ]);

        return to_route('chats.index', ['with' => $user->id]);
    }

    private function isConnected(int $firstUserId, int $secondUserId): bool
    {
        return ConnectionRequest::query()
            ->where('status', 'accepted')
            ->where(fn ($query) => $query
                ->where(fn ($pair) => $pair->where('sender_id', $firstUserId)->where('recipient_id', $secondUserId))
                ->orWhere(fn ($pair) => $pair->where('sender_id', $secondUserId)->where('recipient_id', $firstUserId)))
            ->exists();
    }

    private function conversation(int $firstUserId, int $secondUserId): Builder
    {
        return ChatMessage::query()->where(fn ($query) => $query
            ->where(fn ($pair) => $pair->where('sender_id', $firstUserId)->where('recipient_id', $secondUserId))
            ->orWhere(fn ($pair) => $pair->where('sender_id', $secondUserId)->where('recipient_id', $firstUserId)));
    }
}
