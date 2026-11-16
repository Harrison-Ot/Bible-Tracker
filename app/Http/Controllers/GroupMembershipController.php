<?php

namespace App\Http\Controllers;

use App\Models\ConnectionRequest;
use App\Models\Group;
use App\Models\GroupInvitation;
use App\Models\User;
use App\Services\GroupAccess;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class GroupMembershipController extends Controller
{
    public function __construct(private GroupAccess $access) {}

    public function invite(Request $request, Group $group): RedirectResponse
    {
        DB::transaction(function () use ($request, $group): void {
            $group = $this->access->locked($request->user(), $group, 'manager');
            $data = $request->validate(['recipient_id' => ['required', 'integer']]);
            $target = User::query()->whereKey($data['recipient_id'])->whereNotNull('email_verified_at')->first();
            $connected = $target && ConnectionRequest::query()->where('status', 'accepted')->where(fn ($query) => $query
                ->where(fn ($pair) => $pair->where('sender_id', $request->user()->id)->where('recipient_id', $target->id))
                ->orWhere(fn ($pair) => $pair->where('recipient_id', $request->user()->id)->where('sender_id', $target->id)))->exists();
            if (! $connected || $group->members()->where('users.id', $target->id)->exists()) {
                throw ValidationException::withMessages(['recipient_id' => 'Choose a verified connection who is not already in this group.']);
            }
            $invite = $group->invitations()->firstOrCreate(['recipient_id' => $target->id], ['inviter_id' => $request->user()->id, 'expires_at' => now()->addDays(7)]);
            if (! $invite->wasRecentlyCreated && ($invite->status !== 'pending' || $invite->expires_at->lessThanOrEqualTo(now()))) {
                $invite->update(['status' => 'pending', 'inviter_id' => $request->user()->id, 'expires_at' => now()->addDays(7)]);
            }
        }, 3);

        return to_route('groups.show', $group);
    }

    public function respond(Request $request, GroupInvitation $groupInvitation): RedirectResponse
    {
        abort_unless($groupInvitation->recipient_id === $request->user()->id, 404);
        $group = $groupInvitation->group;
        DB::transaction(function () use ($request, $group, $groupInvitation): void {
            $group = Group::query()->lockForUpdate()->findOrFail($group->id);
            $invite = GroupInvitation::query()->whereKey($groupInvitation->id)->lockForUpdate()->firstOrFail();
            abort_unless($invite->recipient_id === $request->user()->id, 404);
            $data = $request->validate(['status' => ['required', 'in:accepted,declined']]);
            if ($invite->status !== 'pending') {
                return;
            }
            if ($data['status'] === 'declined') {
                $invite->update(['status' => 'declined']);

                return;
            }
            if ($invite->expires_at->lessThanOrEqualTo(now()) || ! $invite->inviter || ! in_array($this->access->role($invite->inviter, $group), ['owner', 'admin'], true)) {
                throw ValidationException::withMessages(['invitation' => 'This invitation is no longer available. Ask a group manager for a new one.']);
            }
            if ($data['status'] === 'accepted') {
                $group->members()->syncWithoutDetaching([$request->user()->id => ['role' => $this->access->role($request->user(), $group) ?? 'member']]);
            }
            $invite->update(['status' => $data['status']]);
        }, 3);

        return $this->access->role($request->user(), $group) ? to_route('groups.show', $group) : to_route('groups.index');
    }

    public function revoke(Request $request, Group $group, GroupInvitation $groupInvitation): RedirectResponse
    {
        DB::transaction(function () use ($request, $group, $groupInvitation): void {
            $group = $this->access->locked($request->user(), $group, 'manager');
            abort_unless($groupInvitation->group_id === $group->id, 404);
            GroupInvitation::query()->whereKey($groupInvitation->id)->where('status', 'pending')->update(['status' => 'revoked']);
        });

        return to_route('groups.show', $group);
    }

    public function role(Request $request, Group $group, User $member): RedirectResponse
    {
        DB::transaction(function () use ($request, $group, $member): void {
            $group = $this->access->locked($request->user(), $group, 'owner');
            abort_if($member->id === $group->owner_id, 403);
            abort_unless($group->members()->where('users.id', $member->id)->exists(), 404);
            $data = $request->validate(['role' => ['required', 'in:admin,member']]);
            $group->members()->updateExistingPivot($member->id, ['role' => $data['role']]);
            if ($data['role'] === 'member') {
                $group->invitations()->where('inviter_id', $member->id)->where('status', 'pending')->update(['status' => 'revoked']);
            }
        });

        return to_route('groups.show', $group);
    }

    public function remove(Request $request, Group $group, User $member): RedirectResponse
    {
        DB::transaction(function () use ($request, $group, $member): void {
            $group = $this->access->locked($request->user(), $group, 'manager');
            $role = $this->access->requireRole($request->user(), $group);
            $target = $this->access->role($member, $group);
            abort_if($member->id === $group->owner_id || $member->id === $request->user()->id || ($role === 'admin' && $target !== 'member'), 403);
            abort_if($target === null, 404);
            $this->access->detach($group, $member);
        });

        return to_route('groups.show', $group);
    }

    public function leave(Request $request, Group $group): RedirectResponse
    {
        DB::transaction(function () use ($request, $group): void {
            $group = $this->access->locked($request->user(), $group);
            if ($group->owner_id === $request->user()->id) {
                throw ValidationException::withMessages(['group' => 'Transfer ownership or delete the group before leaving.']);
            }
            $this->access->detach($group, $request->user());
        });

        return to_route('groups.index');
    }

    public function transfer(Request $request, Group $group): RedirectResponse
    {
        DB::transaction(function () use ($request, $group): void {
            $group = $this->access->locked($request->user(), $group, 'owner');
            $data = $request->validate(['user_id' => ['required', 'integer'], 'confirmation' => ['required', Rule::in([$group->name])]]);
            $target = User::query()->whereKey($data['user_id'])->lockForUpdate()->firstOrFail();
            if ($target->id === $request->user()->id || ! $group->members()->where('users.id', $target->id)->exists()) {
                throw ValidationException::withMessages(['user_id' => 'Choose another current group member.']);
            }
            $group->members()->updateExistingPivot($request->user()->id, ['role' => 'admin']);
            $group->members()->updateExistingPivot($target->id, ['role' => 'owner']);
            $group->update(['owner_id' => $target->id]);
        }, 3);

        return to_route('groups.show', $group);
    }
}
