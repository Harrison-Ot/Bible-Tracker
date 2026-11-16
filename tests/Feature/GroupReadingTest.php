<?php

use App\Models\ConnectionRequest;
use App\Models\Group;
use App\Models\GroupInvitation;
use App\Models\GroupReadingRun;
use App\Models\ReadingPlan;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

function readingGroup(User $owner, array $members = []): Group
{
    $group = Group::query()->create(['name' => 'Our reading circle', 'description' => 'Read thoughtfully together', 'owner_id' => $owner->id, 'created_by_id' => $owner->id, 'creation_token' => (string) Str::uuid()]);
    $group->members()->attach($owner, ['role' => 'owner']);
    foreach ($members as $member) {
        $group->members()->attach($member, ['role' => 'member']);
    }

    return $group;
}

function groupPlan(int $days = 2, ?User $owner = null): ReadingPlan
{
    $plan = ReadingPlan::query()->create(['name' => 'Genesis together', 'slug' => 'group-'.Str::uuid(), 'duration_days' => $days]);
    if ($owner) {
        $plan->forceFill(['user_id' => $owner->id])->save();
    }
    foreach (range(1, $days) as $day) {
        $plan->days()->create(['day_number' => $day, 'book' => 'Genesis', 'chapters' => $day === 1 ? '1-2' : '3']);
    }

    return $plan;
}

function groupRun(Group $group, ReadingPlan $plan): GroupReadingRun
{
    $run = $group->runs()->create(['reading_plan_id' => $plan->id, 'creation_token' => (string) Str::uuid(), 'started_on' => today()]);
    $group->update(['current_run_id' => $run->id]);

    return $run;
}

function groupInvite(Group $group, User $recipient, ?User $inviter = null, array $values = []): GroupInvitation
{
    return $group->invitations()->create(array_replace(['recipient_id' => $recipient->id, 'inviter_id' => ($inviter?->id ?? $group->owner_id), 'status' => 'pending', 'expires_at' => now()->addDays(7)], $values));
}

function groupPostPayload(array $values = []): array
{
    return array_replace(['book_id' => 'GEN', 'chapter' => 1, 'body' => 'What a hopeful beginning.', 'post_token' => (string) Str::uuid()], $values);
}

function logGroupReading(User $user, int $chapter, string $date = '2026-11-16'): void
{
    $user->readingEntries()->create(['book' => 'Genesis', 'chapter' => $chapter, 'read_on' => $date, 'translation' => 'web', 'notes' => 'Private journal reflection']);
}

beforeEach(function () {
    $this->withoutVite();
    $this->travelTo(Carbon::parse('2026-11-16 09:00:00', 'UTC'));
});
afterEach(function () {
    $this->travelBack();
});

it('requires verified authentication for all group entry points', function () {
    $group = readingGroup(User::factory()->create());
    foreach (['/groups', '/groups/'.$group->id] as $path) {
        $this->get($path)->assertRedirect('/login');
    }
    $this->post('/groups')->assertRedirect('/login');
    foreach (['invitations', 'leave', 'ownership', 'reading-plan', 'check-in', 'advance', 'posts'] as $action) {
        $this->post('/groups/'.$group->id.'/'.$action)->assertRedirect('/login');
    }
    $this->patch('/groups/'.$group->id)->assertRedirect('/login');
    $this->delete('/groups/'.$group->id)->assertRedirect('/login');
    $this->actingAs(User::factory()->unverified()->create())->get('/groups')->assertRedirect('/email/verify');
});

it('creates a private group once with an authoritative owner membership', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $payload = ['name' => 'Genesis circle', 'description' => 'Our private group', 'creation_token' => (string) Str::uuid(), 'owner_id' => $other->id, 'role' => 'admin'];
    $this->actingAs($owner)->post('/groups', $payload)->assertRedirect();
    $group = Group::query()->sole();
    $this->post('/groups', $payload)->assertRedirect('/groups/'.$group->id);
    expect($group->owner_id)->toBe($owner->id)->and($group->created_by_id)->toBe($owner->id)->and($group->members()->sole()->pivot->role)->toBe('owner');
    $this->assertDatabaseCount('groups', 1);
    $this->actingAs($other)->post('/groups', $payload)->assertNotFound();
    $this->get('/groups')->assertInertia(fn ($page) => $page->has('groups.data', 0));
});

it('does not reveal groups or allow mutations before membership', function () {
    $owner = User::factory()->create();
    $outsider = User::factory()->create();
    $group = readingGroup($owner);
    $invite = groupInvite($group, $outsider);
    $this->actingAs($outsider)->get('/groups')->assertInertia(fn ($page) => $page->has('groups.data', 0)->has('invitations.data', 1)->where('invitations.data.0.id', $invite->id)->missing('invitations.data.0.group.owner_id'));
    $base = '/groups/'.$group->id;
    $this->get($base)->assertNotFound();
    $this->patch($base, ['name' => 'Stolen'])->assertNotFound();
    $this->delete($base, ['confirmation' => $group->name])->assertNotFound();
    $this->patch($base.'/discussion-lock', ['discussions_locked' => true])->assertNotFound();
    foreach (['invitations', 'leave', 'ownership', 'reading-plan', 'check-in', 'advance', 'posts'] as $action) {
        $this->post($base.'/'.$action, [])->assertNotFound();
    }
});

it('allows only managers to invite their verified accepted connections', function () {
    [$owner, $admin, $member, $target, $stranger, $unverified] = User::factory()->count(6)->create()->all();
    $unverified->forceFill(['email_verified_at' => null])->save();
    $group = readingGroup($owner, [$admin, $member]);
    $group->members()->updateExistingPivot($admin, ['role' => 'admin']);
    ConnectionRequest::query()->create(['sender_id' => $target->id, 'recipient_id' => $admin->id, 'status' => 'accepted']);
    ConnectionRequest::query()->create(['sender_id' => $admin->id, 'recipient_id' => $unverified->id, 'status' => 'accepted']);
    $url = '/groups/'.$group->id.'/invitations';
    $this->actingAs($member)->post($url, ['recipient_id' => $target->id])->assertForbidden();
    foreach ([$stranger, $unverified, $member] as $invalid) {
        $this->actingAs($admin)->post($url, ['recipient_id' => $invalid->id])->assertSessionHasErrors('recipient_id');
    }
    $this->actingAs($admin)->post($url, ['recipient_id' => $target->id])->assertSessionHasNoErrors();
    $invite = $group->invitations()->sole();
    $expires = $invite->expires_at->toIso8601String();
    $this->travel(1)->days();
    $this->post($url, ['recipient_id' => $target->id])->assertSessionHasNoErrors();
    expect($invite->fresh()->expires_at->toIso8601String())->toBe($expires);
    $this->assertDatabaseCount('group_invitations', 1);
    $this->get('/groups/'.$group->id)->assertInertia(fn ($page) => $page->has('inviteCandidates', 1)->where('inviteCandidates.0.id', $target->id)->missing('inviteCandidates.0.email'));
});

it('binds acceptance to its recipient and makes retry safe after removal', function () {
    [$owner, $recipient, $other] = User::factory()->count(3)->create()->all();
    $group = readingGroup($owner);
    $invite = groupInvite($group, $recipient);
    $url = '/group-invitations/'.$invite->id;
    $this->actingAs($other)->patch($url, ['status' => 'accepted'])->assertNotFound();
    $this->actingAs($recipient)->patch($url, ['status' => 'accepted'])->assertRedirect('/groups/'.$group->id);
    $this->patch($url, ['status' => 'accepted'])->assertRedirect();
    expect($group->members()->count())->toBe(2)->and($invite->fresh()->status)->toBe('accepted');
    $this->actingAs($owner)->delete('/groups/'.$group->id.'/members/'.$recipient->id)->assertRedirect();
    $this->actingAs($recipient)->patch($url, ['status' => 'accepted'])->assertRedirect('/groups');
    $this->get('/groups/'.$group->id)->assertNotFound();
});

it('rejects unavailable invitations but still allows declining an expired invitation', function () {
    [$owner, $recipient] = User::factory()->count(2)->create()->all();
    $group = readingGroup($owner);
    $invite = groupInvite($group, $recipient, values: ['expires_at' => now()->subMinute()]);
    $this->actingAs($recipient)->patch('/group-invitations/'.$invite->id, ['status' => 'accepted'])->assertSessionHasErrors('invitation');
    $this->patch('/group-invitations/'.$invite->id, ['status' => 'declined'])->assertSessionHasNoErrors();
    expect($invite->fresh()->status)->toBe('declined');
    foreach (['revoked', 'declined'] as $status) {
        $invite->update(['status' => $status, 'expires_at' => now()->addDay()]);
        $this->patch('/group-invitations/'.$invite->id, ['status' => 'accepted'])->assertRedirect('/groups');
        expect($group->members()->count())->toBe(1);
    }
});

it('renews expired invitations without making a duplicate', function () {
    [$owner, $target] = User::factory()->count(2)->create()->all();
    $group = readingGroup($owner);
    ConnectionRequest::query()->create(['sender_id' => $owner->id, 'recipient_id' => $target->id, 'status' => 'accepted']);
    $invite = groupInvite($group, $target, values: ['expires_at' => now()->subDay()]);
    $this->actingAs($owner)->post('/groups/'.$group->id.'/invitations', ['recipient_id' => $target->id])->assertSessionHasNoErrors();
    expect($invite->fresh()->expires_at->isFuture())->toBeTrue();
    $this->assertDatabaseCount('group_invitations', 1);
});

it('enforces role hierarchy and revokes invitations issued by a demoted admin', function () {
    [$owner, $admin, $member, $target] = User::factory()->count(4)->create()->all();
    $group = readingGroup($owner, [$admin, $member]);
    $base = '/groups/'.$group->id;
    $this->actingAs($member)->patch($base.'/members/'.$member->id, ['role' => 'admin'])->assertForbidden();
    $this->actingAs($owner)->patch($base.'/members/'.$admin->id, ['role' => 'admin'])->assertRedirect();
    $invite = groupInvite($group, $target, $admin);
    $this->actingAs($admin)->patch($base.'/members/'.$member->id, ['role' => 'admin'])->assertForbidden();
    $this->delete($base.'/members/'.$owner->id)->assertForbidden();
    $this->actingAs($owner)->patch($base.'/members/'.$admin->id, ['role' => 'member'])->assertRedirect();
    expect($invite->fresh()->status)->toBe('revoked');
    $this->actingAs($admin)->patch($base.'/discussion-lock', ['discussions_locked' => true])->assertForbidden();
    $this->actingAs($owner)->patch($base.'/members/'.$owner->id, ['role' => 'member'])->assertForbidden();
});

it('allows admins to remove regular members but not other admins and keeps prior content', function () {
    [$owner, $admin, $peer, $member, $recipient] = User::factory()->count(5)->create()->all();
    $group = readingGroup($owner, [$admin, $peer, $member]);
    foreach ([$admin, $peer] as $leader) {
        $group->members()->updateExistingPivot($leader, ['role' => 'admin']);
    }
    $invite = groupInvite($group, $recipient, $peer);
    $post = $group->posts()->create(array_merge(groupPostPayload(), ['user_id' => $member->id]));
    $this->actingAs($admin)->delete('/groups/'.$group->id.'/members/'.$peer->id)->assertForbidden();
    $this->delete('/groups/'.$group->id.'/members/'.$member->id)->assertRedirect();
    $this->assertDatabaseHas('group_posts', ['id' => $post->id]);
    $this->actingAs($owner)->delete('/groups/'.$group->id.'/members/'.$peer->id)->assertRedirect();
    expect($invite->fresh()->status)->toBe('revoked');
    $this->actingAs($member)->get('/groups/'.$group->id)->assertNotFound();
    $this->post('/groups/'.$group->id.'/posts', groupPostPayload())->assertNotFound();
});

it('requires ownership transfer before the owner can leave and revokes invitations on leaving', function () {
    [$owner, $admin, $recipient] = User::factory()->count(3)->create()->all();
    $group = readingGroup($owner, [$admin]);
    $group->members()->updateExistingPivot($admin, ['role' => 'admin']);
    $invite = groupInvite($group, $recipient, $admin);
    $this->actingAs($owner)->post('/groups/'.$group->id.'/leave')->assertSessionHasErrors('group');
    $this->actingAs($admin)->post('/groups/'.$group->id.'/leave')->assertRedirect('/groups');
    expect($invite->fresh()->status)->toBe('revoked')->and($group->members()->count())->toBe(1);
});

it('transfers ownership only to a current member with exact confirmation', function () {
    [$owner, $next, $outsider] = User::factory()->count(3)->create()->all();
    $group = readingGroup($owner, [$next]);
    $url = '/groups/'.$group->id.'/ownership';
    $this->actingAs($owner)->post($url, ['user_id' => $next->id, 'confirmation' => 'wrong'])->assertSessionHasErrors('confirmation');
    $this->post($url, ['user_id' => $outsider->id, 'confirmation' => $group->name])->assertSessionHasErrors('user_id');
    $this->post($url, ['user_id' => $next->id, 'confirmation' => $group->name])->assertSessionHasNoErrors();
    expect($group->fresh()->owner_id)->toBe($next->id)->and($group->members()->find($owner->id)->pivot->role)->toBe('admin')->and($group->members()->find($next->id)->pivot->role)->toBe('owner');
    $this->patch('/groups/'.$group->id, ['name' => 'Old owner change'])->assertForbidden();
    $this->actingAs($next)->patch('/groups/'.$group->id, ['name' => 'New owner change', 'description' => 'Updated'])->assertRedirect();
    expect($group->fresh()->name)->toBe('New owner change');
});

it('blocks account deletion while owning a group and allows it after transfer', function () {
    [$owner, $next] = User::factory()->count(2)->create()->all();
    $group = readingGroup($owner, [$next]);
    $this->actingAs($owner)->get('/settings/profile')->assertInertia(fn ($page) => $page->where('ownedGroupCount', 1));
    $this->delete('/settings/profile', ['password' => 'password'])->assertSessionHasErrors('password');
    $this->assertAuthenticatedAs($owner);
    $this->assertDatabaseHas('users', ['id' => $owner->id]);
    $post = $group->posts()->create(array_merge(groupPostPayload(), ['user_id' => $owner->id]));
    $run = groupRun($group, groupPlan());
    DB::table('group_reading_checkins')->insert(['group_reading_run_id' => $run->id, 'user_id' => $owner->id, 'day_number' => 1, 'checked_in_at' => now()]);
    $this->post('/groups/'.$group->id.'/ownership', ['user_id' => $next->id, 'confirmation' => $group->name])->assertRedirect();
    $this->delete('/settings/profile', ['password' => 'password'])->assertRedirect('/');
    $this->assertDatabaseHas('groups', ['id' => $group->id, 'owner_id' => $next->id]);
    $this->assertDatabaseMissing('group_posts', ['id' => $post->id]);
    $this->assertDatabaseCount('group_reading_checkins', 0);
});

it('shares guided plans only and keeps a new run independent of personal progress', function () {
    [$owner, $member] = User::factory()->count(2)->create()->all();
    $group = readingGroup($owner, [$member]);
    $public = groupPlan();
    $private = groupPlan(owner: $owner);
    $payload = ['reading_plan_id' => $public->id, 'creation_token' => (string) Str::uuid()];
    $url = '/groups/'.$group->id.'/reading-plan';
    $this->actingAs($member)->post($url, $payload)->assertForbidden();
    $this->actingAs($owner)->post($url, array_replace($payload, ['reading_plan_id' => $private->id]))->assertSessionHasErrors('reading_plan_id');
    $this->post($url, $payload)->assertSessionHasNoErrors();
    $this->post($url, $payload)->assertRedirect();
    $this->assertDatabaseCount('group_reading_runs', 1);
    $this->assertDatabaseCount('user_plan_progress', 0);
    $this->get('/groups/'.$group->id)->assertInertia(fn ($page) => $page->has('availablePlans', 1)->where('sharedPlan.currentDay', 1)->where('sharedPlan.readings.0.isRead', false));
});

it('archives the prior run and makes stale creation retries unable to rewind it', function () {
    $owner = User::factory()->create();
    $group = readingGroup($owner);
    $plan = groupPlan();
    $old = groupRun($group, $plan);
    DB::table('group_reading_checkins')->insert(['group_reading_run_id' => $old->id, 'user_id' => $owner->id, 'day_number' => 1, 'checked_in_at' => now()]);
    $url = '/groups/'.$group->id.'/reading-plan';
    $this->actingAs($owner)->post($url, ['reading_plan_id' => $plan->id, 'creation_token' => (string) Str::uuid()])->assertRedirect();
    $current = $group->fresh()->current_run_id;
    expect($old->fresh()->archived_at)->not->toBeNull()->and($current)->not->toBe($old->id);
    $this->post($url, ['reading_plan_id' => $plan->id, 'creation_token' => $old->creation_token])->assertRedirect();
    expect($group->fresh()->current_run_id)->toBe($current);
    $this->assertDatabaseCount('group_reading_checkins', 1);
});

it('requires all of the readers own logged chapters within the run dates before explicit check in', function () {
    [$owner, $member] = User::factory()->count(2)->create()->all();
    $group = readingGroup($owner, [$member]);
    $run = groupRun($group, groupPlan());
    logGroupReading($owner, 2);
    logGroupReading($member, 1);
    logGroupReading($member, 2, '2026-11-15');
    logGroupReading($member, 2, '2026-11-17');
    $payload = ['run_id' => $run->id, 'expected_day' => 1];
    $this->actingAs($member)->post('/groups/'.$group->id.'/check-in', $payload)->assertSessionHasErrors('reading');
    logGroupReading($member, 2);
    $this->get('/groups/'.$group->id)->assertInertia(fn ($page) => $page->where('sharedPlan.canCheckIn', true)->where('sharedPlan.checkedIn', false)->has('sharedPlan.checkins', 0));
    foreach (range(1, 2) as $retry) {
        $this->post('/groups/'.$group->id.'/check-in', $payload)->assertSessionHasNoErrors();
    }
    $this->assertDatabaseCount('group_reading_checkins', 1);
    $this->get('/groups/'.$group->id)->assertInertia(fn ($page) => $page->where('sharedPlan.checkedIn', true)->where('sharedPlan.checkins.0.name', $member->name)->missing('sharedPlan.checkins.0.email')->missing('sharedPlan.checkins.0.notes'));
});

it('shares no other members journals or reading status and excludes departed members from current checkins', function () {
    [$owner, $member] = User::factory()->count(2)->create()->all();
    $group = readingGroup($owner, [$member]);
    $group->update(['whatsapp_jid' => 'private-jid', 'invite_link' => 'private-link']);
    $run = groupRun($group, groupPlan());
    logGroupReading($member, 1);
    logGroupReading($member, 2);
    $this->actingAs($owner)->get('/groups/'.$group->id)->assertInertia(fn ($page) => $page->where('sharedPlan.readings.0.isRead', false)->has('sharedPlan.checkins', 0)->has('members.0', 4)->missing('group.whatsapp_jid')->missing('group.invite_link')->missing('members.0.email'));
    $this->actingAs($member)->post('/groups/'.$group->id.'/check-in', ['run_id' => $run->id, 'expected_day' => 1])->assertRedirect();
    $this->post('/groups/'.$group->id.'/leave')->assertRedirect();
    $this->actingAs($owner)->get('/groups/'.$group->id)->assertInertia(fn ($page) => $page->has('sharedPlan.checkins', 0));
    $this->assertDatabaseCount('group_reading_checkins', 1);
});

it('allows managers to advance once with stale safeguards without changing personal records', function () {
    [$owner, $member] = User::factory()->count(2)->create()->all();
    $group = readingGroup($owner, [$member]);
    $plan = groupPlan();
    $run = groupRun($group, $plan);
    $progress = $member->readingPlanProgress()->create(['reading_plan_id' => $plan->id, 'current_day' => 1, 'started_on' => today()]);
    $url = '/groups/'.$group->id.'/advance';
    $payload = ['run_id' => $run->id, 'expected_day' => 1];
    $this->actingAs($member)->post($url, $payload)->assertForbidden();
    $this->actingAs($owner)->post($url, array_replace($payload, ['run_id' => 999]))->assertRedirect();
    expect($run->fresh()->current_day)->toBe(1);
    $this->post($url, $payload)->assertRedirect();
    $this->post($url, $payload)->assertRedirect();
    expect($run->fresh()->current_day)->toBe(2)->and($progress->fresh()->current_day)->toBe(1);
    $this->post('/groups/'.$group->id.'/check-in', $payload)->assertSessionHasErrors('reading');
    $this->post($url, array_replace($payload, ['expected_day' => 2]))->assertRedirect();
    $this->post($url, array_replace($payload, ['expected_day' => 3]))->assertRedirect();
    expect($run->fresh()->current_day)->toBe(3)->and($run->fresh()->completed_at)->not->toBeNull();
    $this->get('/groups/'.$group->id)->assertInertia(fn ($page) => $page->where('sharedPlan.complete', true));
    $this->assertDatabaseCount('reading_entries', 0);
    $this->assertDatabaseCount('reading_plan_completions', 0);
});

it('validates passage bounds and body length and stores plain text once', function () {
    [$owner, $member] = User::factory()->count(2)->create()->all();
    $group = readingGroup($owner, [$member]);
    $url = '/groups/'.$group->id.'/posts';
    $this->actingAs($member);
    foreach ([['book_id' => 'bogus'], ['chapter' => 0], ['book_id' => 'JUD', 'chapter' => 2], ['body' => ''], ['body' => str_repeat('x', 2001)], ['post_token' => 'bad']] as $invalid) {
        $this->post($url, groupPostPayload($invalid))->assertSessionHasErrors();
    }
    $payload = groupPostPayload(['body' => '<script>alert("private")</script> A reflection.', 'user_id' => $owner->id]);
    $this->post($url, $payload)->assertSessionHasNoErrors();
    $this->post($url, $payload)->assertRedirect();
    $post = $group->posts()->sole();
    expect($post->user_id)->toBe($member->id)->and($post->body)->toBe($payload['body']);
    $this->assertDatabaseCount('group_posts', 1);
    $this->get('/groups/'.$group->id)->assertInertia(fn ($page) => $page->where('posts.data.0.body', $payload['body'])->missing('posts.data.0.post_token'));
});

it('allows authors and moderators to remove text permanently without reviving it on retry', function () {
    [$owner, $author, $other] = User::factory()->count(3)->create()->all();
    $group = readingGroup($owner, [$author, $other]);
    $payload = groupPostPayload();
    $post = $group->posts()->create(array_merge($payload, ['user_id' => $author->id]));
    $url = '/groups/'.$group->id.'/posts/'.$post->id;
    $this->actingAs($other)->delete($url)->assertForbidden();
    $this->actingAs($author)->delete($url)->assertRedirect();
    $this->post('/groups/'.$group->id.'/posts', $payload)->assertRedirect();
    expect($post->fresh()->body)->toBeNull()->and($post->fresh()->removed_by)->toBe($author->id);
    $this->actingAs($owner)->delete($url)->assertRedirect();
    expect($post->fresh()->removed_by)->toBe($author->id);
    $this->get('/groups/'.$group->id)->assertInertia(fn ($page) => $page->where('posts.data.0.body', null)->where('posts.data.0.removed', true)->where('posts.data.0.removedByModerator', false));
    $second = $group->posts()->create(array_merge(groupPostPayload(), ['user_id' => $author->id]));
    $this->delete('/groups/'.$group->id.'/posts/'.$second->id)->assertRedirect();
    expect($second->fresh()->body)->toBeNull()->and($second->fresh()->removed_by)->toBe($owner->id);
});

it('locks member posting while allowing manager moderation and reading access', function () {
    [$owner, $admin, $member] = User::factory()->count(3)->create()->all();
    $group = readingGroup($owner, [$admin, $member]);
    $group->members()->updateExistingPivot($admin, ['role' => 'admin']);
    $base = '/groups/'.$group->id;
    $this->actingAs($member)->patch($base.'/discussion-lock', ['discussions_locked' => true])->assertForbidden();
    $this->actingAs($admin)->patch($base.'/discussion-lock', ['discussions_locked' => true])->assertRedirect();
    $this->post($base.'/posts', groupPostPayload())->assertRedirect();
    $this->actingAs($member)->post($base.'/posts', groupPostPayload())->assertForbidden();
    $this->get($base)->assertInertia(fn ($page) => $page->where('permissions.post', false)->where('permissions.manage', false)->where('permissions.owner', false)->has('availablePlans', 0)->has('inviteCandidates', 0)->has('invitations', 0));
    $this->actingAs($admin)->patch($base.'/discussion-lock', ['discussions_locked' => false])->assertRedirect();
    $this->actingAs($member)->post($base.'/posts', groupPostPayload())->assertRedirect();
});

it('scopes nested posts and invitations to their group and validates discussion filters', function () {
    [$owner, $recipient] = User::factory()->count(2)->create()->all();
    $first = readingGroup($owner);
    $other = readingGroup($owner);
    $post = $other->posts()->create(array_merge(groupPostPayload(), ['user_id' => $owner->id]));
    $invite = groupInvite($other, $recipient);
    $this->actingAs($owner)->delete('/groups/'.$first->id.'/posts/'.$post->id)->assertNotFound();
    $this->delete('/groups/'.$first->id.'/invitations/'.$invite->id)->assertNotFound();
    $this->get('/groups/'.$other->id.'?book=GEN&chapter=1')->assertInertia(fn ($page) => $page->has('posts.data', 1));
    $this->get('/groups/'.$other->id.'?book=EXO')->assertInertia(fn ($page) => $page->has('posts.data', 0));
    foreach (['?chapter=2', '?book=JUD&chapter=2', '?book=bogus'] as $query) {
        $this->get('/groups/'.$first->id.$query)->assertSessionHasErrors();
    }
    expect($post->fresh()->body)->not->toBeNull()->and($invite->fresh()->status)->toBe('pending');
});

it('deletes group data only with owner confirmation and preserves personal readings and plans', function () {
    [$owner, $member, $recipient] = User::factory()->count(3)->create()->all();
    $group = readingGroup($owner, [$member]);
    $plan = groupPlan();
    $run = groupRun($group, $plan);
    groupInvite($group, $recipient);
    $group->posts()->create(array_merge(groupPostPayload(), ['user_id' => $member->id]));
    DB::table('group_reading_checkins')->insert(['group_reading_run_id' => $run->id, 'user_id' => $member->id, 'day_number' => 1, 'checked_in_at' => now()]);
    logGroupReading($member, 1);
    $member->readingPlanProgress()->create(['reading_plan_id' => $plan->id, 'current_day' => 1, 'started_on' => today()]);
    $url = '/groups/'.$group->id;
    $this->actingAs($member)->delete($url, ['confirmation' => $group->name])->assertForbidden();
    $this->actingAs($owner)->delete($url, ['confirmation' => 'wrong'])->assertSessionHasErrors('confirmation');
    $this->delete($url, ['confirmation' => $group->name])->assertRedirect('/groups');
    foreach (['groups', 'group_user', 'group_posts', 'group_reading_runs', 'group_invitations', 'group_reading_checkins'] as $table) {
        $this->assertDatabaseCount($table, 0);
    }
    $this->assertDatabaseCount('reading_entries', 1);
    $this->assertDatabaseCount('user_plan_progress', 1);
    $this->assertDatabaseCount('reading_plans', 1);
});

it('cannot reuse the creation token to regain access after transferring and leaving', function () {
    [$owner, $next] = User::factory()->count(2)->create()->all();
    $group = readingGroup($owner, [$next]);
    $this->actingAs($owner)->post('/groups/'.$group->id.'/ownership', ['user_id' => $next->id, 'confirmation' => $group->name])->assertRedirect();
    $this->post('/groups/'.$group->id.'/leave')->assertRedirect();
    $this->post('/groups', ['name' => $group->name, 'creation_token' => $group->creation_token])->assertRedirect('/groups');
    $this->get('/groups/'.$group->id)->assertNotFound();
    expect($group->members()->count())->toBe(1);
});

it('rejects invitations exactly at expiry and if the inviter is no longer a manager', function () {
    [$owner, $admin, $recipient] = User::factory()->count(3)->create()->all();
    $group = readingGroup($owner, [$admin]);
    $invite = groupInvite($group, $recipient, values: ['expires_at' => now()]);
    $this->actingAs($recipient)->patch('/group-invitations/'.$invite->id, ['status' => 'accepted'])->assertSessionHasErrors('invitation');
    $invite->update(['inviter_id' => $admin->id, 'expires_at' => now()->addDay()]);
    $this->patch('/group-invitations/'.$invite->id, ['status' => 'accepted'])->assertSessionHasErrors('invitation');
    expect($group->members()->count())->toBe(2);
});

it('revokes an invitation without allowing later acceptance', function () {
    [$owner, $recipient] = User::factory()->count(2)->create()->all();
    $group = readingGroup($owner);
    $invite = groupInvite($group, $recipient);
    $this->actingAs($owner)->delete('/groups/'.$group->id.'/invitations/'.$invite->id)->assertRedirect();
    $this->actingAs($recipient)->patch('/group-invitations/'.$invite->id, ['status' => 'accepted'])->assertRedirect('/groups');
    expect($invite->fresh()->status)->toBe('revoked')->and($group->members()->count())->toBe(1);
});

it('paginates discussions while keeping passage filters and private data out of props', function () {
    [$owner, $member] = User::factory()->count(2)->create()->all();
    $group = readingGroup($owner, [$member]);
    logGroupReading($owner, 1);
    foreach (range(1, 21) as $number) {
        $group->posts()->create(array_merge(groupPostPayload(['body' => 'Reflection '.$number]), ['user_id' => $owner->id]));
    }
    $response = $this->actingAs($member)->get('/groups/'.$group->id.'?book=GEN&chapter=1');
    $response->assertInertia(fn ($page) => $page->has('posts.data', 20)->where('posts.total', 21)->where('posts.data.0.body', 'Reflection 21')->where('posts.next_page_url', fn ($url) => str_contains($url, 'book=GEN') && str_contains($url, 'chapter=1'))->missing('members.0.email')->missing('members.0.reading_entries'));
    $response->assertDontSee('Private journal reflection');
    $this->get('/groups/'.$group->id.'?book=GEN&chapter=1&page=2')->assertInertia(fn ($page) => $page->has('posts.data', 1)->where('posts.data.0.body', 'Reflection 1'));
});
