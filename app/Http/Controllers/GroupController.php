<?php

namespace App\Http\Controllers;

use App\Models\ConnectionRequest;
use App\Models\Group;
use App\Models\GroupInvitation;
use App\Models\ReadingPlan;
use App\Models\User;
use App\Services\BibleCatalog;
use App\Services\GroupAccess;
use App\Services\ReadingPlanService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class GroupController extends Controller
{
    public function __construct(private GroupAccess $access, private ReadingPlanService $readings) {}

    public function index(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('groups/index', [
            'creationToken' => (string) Str::uuid(),
            'groups' => Group::query()->where(fn ($query) => $query->where('owner_id', $user->id)->orWhereHas('members', fn ($members) => $members->where('users.id', $user->id)))
                ->withCount('members')->orderBy('name')->paginate(12)->withQueryString()->through(fn (Group $group): array => [
                    'id' => $group->id, 'name' => $group->name, 'description' => $group->description, 'membersCount' => $group->members_count, 'role' => $this->access->role($user, $group),
                ]),
            'invitations' => GroupInvitation::query()->where('recipient_id', $user->id)->where('status', 'pending')->where('expires_at', '>', now())
                ->with(['group:id,name,description', 'inviter:id,name'])->latest()->paginate(10, ['*'], 'invitations_page')->withQueryString()
                ->through(fn ($invite): array => ['id' => $invite->id, 'groupName' => $invite->group->name, 'description' => $invite->group->description, 'inviterName' => $invite->inviter->name ?? 'Group manager', 'expiresAt' => $invite->expires_at->toIso8601String()]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate(['name' => ['required', 'string', 'max:80'], 'description' => ['nullable', 'string', 'max:500'], 'creation_token' => ['required', 'uuid']]);
        $group = DB::transaction(function () use ($request, $data): Group {
            $group = Group::query()->firstOrCreate(['creation_token' => $data['creation_token']], [
                'name' => $data['name'], 'description' => $data['description'] ?? null, 'owner_id' => $request->user()->id, 'created_by_id' => $request->user()->id,
            ]);
            abort_unless($group->created_by_id === $request->user()->id, 404);
            if ($group->wasRecentlyCreated) {
                $group->members()->attach($request->user()->id, ['role' => 'owner']);
            }

            return $group;
        }, 3);

        return $this->access->role($request->user(), $group) ? to_route('groups.show', $group) : to_route('groups.index');
    }

    public function show(Request $request, Group $group): Response
    {
        $user = $request->user();
        $role = $this->access->requireRole($user, $group);
        $manager = in_array($role, ['owner', 'admin'], true);
        $filters = $request->validate(['book' => ['nullable', 'required_with:chapter', Rule::in(array_column(BibleCatalog::books(), 'id'))], 'chapter' => ['nullable', 'integer', 'between:1,150']]);
        if (! empty($filters['book']) && ! empty($filters['chapter']) && $filters['chapter'] > BibleCatalog::find($filters['book'])['chapters']) {
            throw ValidationException::withMessages(['chapter' => 'Choose a valid chapter for this book.']);
        }
        $members = $group->members()->orderBy('name')->get();
        $memberIds = $members->modelKeys();
        $run = $group->runs()->whereKey($group->current_run_id)->with('plan')->first();
        $shared = null;
        if ($run && $run->plan) {
            $complete = $run->current_day > $run->plan->duration_days;
            $assignments = $complete ? [] : $this->readings->readings($run->plan, $run->current_day, $this->readings->readKeysSince($user, $run->started_on));
            $checkins = DB::table('group_reading_checkins')->join('users', 'users.id', '=', 'group_reading_checkins.user_id')
                ->where('group_reading_run_id', $run->id)->where('day_number', min($run->current_day, $run->plan->duration_days))->whereIn('user_id', $memberIds)->orderBy('users.name')->get(['users.id', 'users.name']);
            $shared = ['id' => $run->id, 'name' => $run->plan->name, 'currentDay' => $run->current_day, 'totalDays' => $run->plan->duration_days,
                'complete' => $complete, 'readings' => $assignments, 'checkedIn' => $checkins->contains('id', $user->id),
                'checkins' => $checkins->map(fn ($member): array => ['name' => $member->name]),
                'canCheckIn' => ! $complete && $assignments !== [] && collect($assignments)->every(fn ($reading) => $reading['isRead'])];
        }
        $posts = $group->posts()->with('author:id,name');
        if (! empty($filters['book'])) {
            $posts->where('book_id', $filters['book']);
        }
        if (! empty($filters['chapter'])) {
            $posts->where('chapter', (int) $filters['chapter']);
        }
        $connectedIds = ConnectionRequest::query()->where('status', 'accepted')->where(fn ($query) => $query->where('sender_id', $user->id)->orWhere('recipient_id', $user->id))
            ->get(['sender_id', 'recipient_id'])->map(fn ($connection) => $connection->sender_id === $user->id ? $connection->recipient_id : $connection->sender_id)->all();

        return Inertia::render('groups/show', [
            'group' => ['id' => $group->id, 'name' => $group->name, 'description' => $group->description, 'locked' => $group->discussions_locked, 'role' => $role],
            'permissions' => ['manage' => $manager, 'owner' => $role === 'owner', 'post' => ! $group->discussions_locked || $manager],
            'members' => $members->map(function (User $member) use ($user, $group, $role): array {
                $targetRole = $this->access->role($member, $group);

                return ['id' => $member->id, 'name' => $member->name, 'role' => $targetRole,
                    'canRemove' => $member->id !== $user->id && $targetRole !== 'owner' && ($role === 'owner' || ($role === 'admin' && $targetRole === 'member'))];
            }),
            'invitations' => $manager ? $group->invitations()->where('status', 'pending')->with('recipient:id,name')->latest()->get()->map(fn ($invite): array => ['id' => $invite->id, 'name' => $invite->recipient->name, 'expired' => $invite->expires_at->isPast(), 'expiresAt' => $invite->expires_at->toIso8601String()]) : [],
            'inviteCandidates' => $manager ? User::query()->whereIn('id', $connectedIds)->whereNotIn('id', $memberIds)->whereNotNull('email_verified_at')->orderBy('name')->get(['id', 'name']) : [],
            'sharedPlan' => $shared,
            'availablePlans' => $manager ? ReadingPlan::query()->whereNull('user_id')->orderBy('duration_days')->get(['id', 'name', 'duration_days'])->map(fn ($plan): array => ['id' => $plan->id, 'name' => $plan->name, 'readings' => $plan->duration_days]) : [],
            'planToken' => (string) Str::uuid(), 'postToken' => (string) Str::uuid(), 'books' => BibleCatalog::books(), 'filters' => $filters,
            'posts' => $posts->latest('id')->paginate(20)->withQueryString()->through(fn ($post): array => [
                'id' => $post->id, 'author' => $post->author->name ?? 'Former member', 'body' => $post->removed_at ? null : $post->body,
                'reference' => (BibleCatalog::find($post->book_id)['name'] ?? $post->book_id).' '.$post->chapter,
                'bookId' => $post->book_id, 'chapter' => $post->chapter, 'url' => route('bible.show', ['bookId' => $post->book_id, 'chapter' => $post->chapter]),
                'createdAt' => $post->created_at->toIso8601String(), 'removed' => $post->removed_at !== null,
                'removedByModerator' => $post->removed_at && $post->removed_by !== $post->user_id,
                'canRemove' => ! $post->removed_at && ($manager || $post->user_id === $user->id),
            ]),
        ]);
    }

    public function update(Request $request, Group $group): RedirectResponse
    {
        DB::transaction(function () use ($request, $group): void {
            $group = $this->access->locked($request->user(), $group, 'owner');
            $data = $request->validate(['name' => ['required', 'string', 'max:80'], 'description' => ['nullable', 'string', 'max:500']]);
            $group->update($data);
        });

        return to_route('groups.show', $group);
    }

    public function lock(Request $request, Group $group): RedirectResponse
    {
        DB::transaction(function () use ($request, $group): void {
            $group = $this->access->locked($request->user(), $group, 'manager');
            $group->update($request->validate(['discussions_locked' => ['required', 'boolean']]));
        });

        return to_route('groups.show', $group);
    }

    public function destroy(Request $request, Group $group): RedirectResponse
    {
        DB::transaction(function () use ($request, $group): void {
            $group = $this->access->locked($request->user(), $group, 'owner');
            $request->validate(['confirmation' => ['required', Rule::in([$group->name])]]);
            $group->delete();
        });
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Group deleted. Personal journals and plans are unchanged.']);

        return to_route('groups.index');
    }
}
