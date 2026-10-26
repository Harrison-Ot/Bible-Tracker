<?php

namespace App\Http\Controllers;

use App\Models\ConnectionRequest;
use App\Models\User;
use App\Notifications\ConnectionRequestNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ConnectionRequestController extends Controller
{
    public function store(Request $request, User $user): RedirectResponse
    {
        abort_if($request->user()->is($user), 422, 'You cannot connect with yourself.');

        $existing = ConnectionRequest::query()
            ->where(function ($query) use ($request, $user): void {
                $query->where('sender_id', $request->user()->id)
                    ->where('recipient_id', $user->id);
            })
            ->orWhere(function ($query) use ($request, $user): void {
                $query->where('sender_id', $user->id)
                    ->where('recipient_id', $request->user()->id);
            })
            ->first();

        if ($existing?->status === 'accepted') {
            return back();
        }

        if ($existing?->status === 'pending') {
            return back();
        }

        if ($existing?->status === 'declined') {
            $existing->update([
                'sender_id' => $request->user()->id,
                'recipient_id' => $user->id,
                'status' => 'pending',
            ]);
            $connectionRequest = $existing;
        } else {
            $connectionRequest = ConnectionRequest::query()->create([
                'sender_id' => $request->user()->id,
                'recipient_id' => $user->id,
                'status' => 'pending',
            ]);
        }

        $user->notify(new ConnectionRequestNotification($connectionRequest->load('sender')));

        return back();
    }

    public function update(Request $request, ConnectionRequest $connectionRequest): RedirectResponse
    {
        abort_unless($connectionRequest->recipient_id === $request->user()->id, 403);

        $validated = $request->validate([
            'status' => ['required', Rule::in(['accepted', 'declined'])],
        ]);

        if ($connectionRequest->status !== 'pending') {
            return back();
        }

        $connectionRequest->update(['status' => $validated['status']]);

        $request->user()->notifications()
            ->where('data->connection_request_id', $connectionRequest->id)
            ->whereNull('read_at')
            ->get()
            ->each->markAsRead();

        if ($validated['status'] === 'accepted') {
            $connectionRequest->sender->notify(new ConnectionRequestNotification(
                $connectionRequest->load('sender'),
                'connection_accepted',
                $request->user()->name.' accepted your connection request.',
            ));
        }

        return back();
    }
}