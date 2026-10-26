<?php

namespace App\Http\Controllers;

use App\Models\ConnectionRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MemberController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $connections = ConnectionRequest::query()
            ->where(function ($query) use ($user): void {
                $query->where('sender_id', $user->id)->orWhere('recipient_id', $user->id);
            })
            ->get(['id', 'sender_id', 'recipient_id', 'status']);

        $members = User::query()
            ->where('id', '!=', $user->getKey())
            ->orderBy('name')
            ->paginate(18)
            ->through(function (User $member) use ($user, $connections): array {
                $outgoing = $connections->first(fn (ConnectionRequest $connection): bool =>
                    $connection->sender_id === $user->id && $connection->recipient_id === $member->id
                );
                $incoming = $connections->first(fn (ConnectionRequest $connection): bool =>
                    $connection->sender_id === $member->id && $connection->recipient_id === $user->id
                );

                return [
                    'id' => $member->id,
                    'name' => $member->name,
                    'avatarUrl' => $member->avatar_url,
                    'connectionStatus' => $outgoing?->status === 'accepted' || $incoming?->status === 'accepted'
                        ? 'connected'
                        : ($incoming?->status === 'pending'
                            ? 'incoming'
                            : ($outgoing?->status === 'pending' ? 'pending' : 'none')),
                    'incomingRequestId' => $incoming?->status === 'pending' ? $incoming->id : null,
                ];
            });

        return Inertia::render('members/index', [
            'members' => $members,
        ]);
    }
}