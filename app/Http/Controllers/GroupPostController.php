<?php

namespace App\Http\Controllers;

use App\Models\Group;
use App\Models\GroupPost;
use App\Services\BibleCatalog;
use App\Services\GroupAccess;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class GroupPostController extends Controller
{
    public function __construct(private GroupAccess $access) {}

    public function store(Request $request, Group $group): RedirectResponse
    {
        DB::transaction(function () use ($request, $group): void {
            $group = $this->access->locked($request->user(), $group);
            $role = $this->access->requireRole($request->user(), $group);
            abort_if($group->discussions_locked && $role === 'member', 403, 'Discussions are locked for members.');
            $data = $request->validate(['book_id' => ['required', Rule::in(array_column(BibleCatalog::books(), 'id'))], 'chapter' => ['required', 'integer', 'between:1,150'], 'body' => ['required', 'string', 'max:2000'], 'post_token' => ['required', 'uuid']]);
            $book = BibleCatalog::find($data['book_id']);
            if ($data['chapter'] > $book['chapters']) {
                throw ValidationException::withMessages(['chapter' => 'Choose a valid chapter for this book.']);
            }
            $group->posts()->firstOrCreate(['user_id' => $request->user()->id, 'post_token' => $data['post_token']], ['book_id' => $book['id'], 'chapter' => (int) $data['chapter'], 'body' => $data['body']]);
        }, 3);

        return to_route('groups.show', $group);
    }

    public function destroy(Request $request, Group $group, GroupPost $groupPost): RedirectResponse
    {
        DB::transaction(function () use ($request, $group, $groupPost): void {
            $group = $this->access->locked($request->user(), $group);
            $groupPost->refresh();
            abort_unless($groupPost->group_id === $group->id, 404);
            $role = $this->access->requireRole($request->user(), $group);
            abort_unless($groupPost->user_id === $request->user()->id || in_array($role, ['owner', 'admin'], true), 403);
            if (! $groupPost->removed_at) {
                $groupPost->update(['body' => null, 'removed_at' => now(), 'removed_by' => $request->user()->id]);
            }
        });

        return to_route('groups.show', $group);
    }
}
