<?php

namespace App\Services;

use App\Models\Group;
use App\Models\GroupInvitation;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class GroupAccess
{
    public function role(User $user, Group $group): ?string
    {
        if ($group->owner_id === $user->id) {
            return 'owner';
        }
        $role = DB::table('group_user')->where('group_id', $group->id)->where('user_id', $user->id)->value('role');

        return $role === null ? null : ($role === 'admin' ? 'admin' : 'member');
    }

    public function requireRole(User $user, Group $group, string $level = 'member'): string
    {
        $role = $this->role($user, $group);
        abort_if($role === null, 404);
        abort_if($level === 'manager' && ! in_array($role, ['owner', 'admin'], true), 403);
        abort_if($level === 'owner' && $role !== 'owner', 403);

        return $role;
    }

    public function locked(User $user, Group $group, string $level = 'member'): Group
    {
        $locked = Group::query()->lockForUpdate()->findOrFail($group->id);
        $this->requireRole($user, $locked, $level);

        return $locked;
    }

    public function detach(Group $group, User $user): void
    {
        $group->members()->detach($user->id);
        GroupInvitation::query()->where('group_id', $group->id)->where('status', 'pending')
            ->where(fn ($query) => $query->where('recipient_id', $user->id)->orWhere('inviter_id', $user->id))->update(['status' => 'revoked']);
    }
}
