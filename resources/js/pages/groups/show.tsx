import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    BookOpenCheck,
    Check,
    LockKeyhole,
    MessageSquare,
    ShieldCheck,
    UsersRound,
} from 'lucide-react';
import { useState } from 'react';
import {
    GroupForm,
    GroupPagination,
    groupCardClass,
    groupInputClass,
} from '@/components/group-form';
import type { BibleBook } from '@/components/log-reading-form';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useActionRequest } from '@/hooks/use-action-request';
import type {
    GroupMember,
    GroupPage,
    GroupPost,
    GroupRole,
    SharedGroupPlan,
} from '@/types/groups';

type Props = {
    group: {
        id: number;
        name: string;
        description: string | null;
        locked: boolean;
        role: GroupRole;
    };
    permissions: { manage: boolean; owner: boolean; post: boolean };
    members: GroupMember[];
    invitations: {
        id: number;
        name: string;
        expired: boolean;
        expiresAt: string;
    }[];
    inviteCandidates: { id: number; name: string }[];
    sharedPlan: SharedGroupPlan | null;
    availablePlans: { id: number; name: string; readings: number }[];
    planToken: string;
    postToken: string;
    books: BibleBook[];
    filters: { book?: string; chapter?: string | number };
    posts: GroupPage<GroupPost>;
};
export default function GroupWorkspace({
    group,
    permissions,
    members,
    invitations,
    inviteCandidates,
    sharedPlan,
    availablePlans,
    planToken,
    postToken,
    books,
    filters,
    posts,
}: Props) {
    const action = useActionRequest();
    const [formBusy, setFormBusy] = useState(false);
    const busy = formBusy || action.pending !== null;
    const base = `/groups/${group.id}`;
    const [postBook, setPostBook] = useState(books[0]?.id ?? 'GEN');
    const chapterMax =
        books.find((book) => book.id === postBook)?.chapters ?? 150;
    return (
        <>
            <Head title={group.name} />
            <main className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
                <Link
                    href="/groups"
                    className="text-primary inline-flex items-center gap-2 text-sm font-medium hover:underline"
                >
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    Reading groups
                </Link>
                <header className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                        <span className="bg-muted inline-flex items-center gap-1 rounded-full px-3 py-1">
                            <LockKeyhole
                                className="size-3.5"
                                aria-hidden="true"
                            />
                            Private group
                        </span>
                        <span className="bg-primary/10 text-primary rounded-full px-3 py-1 capitalize">
                            {group.role}
                        </span>
                    </div>
                    <h1 className="text-3xl font-semibold tracking-tight break-words">
                        {group.name}
                    </h1>
                    {group.description && (
                        <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed break-words whitespace-pre-wrap">
                            {group.description}
                        </p>
                    )}
                    <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
                        Only members can see this space. Your journal, notes,
                        saved verses and personal plans stay private. Check-ins
                        share your name and completion for the group reading.
                    </p>
                </header>
                {action.feedback && (
                    <p
                        role={action.feedback.error ? 'alert' : 'status'}
                        className={`rounded-lg border p-3 text-sm ${action.feedback.error ? 'text-destructive' : 'text-primary'}`}
                    >
                        {action.feedback.message}
                    </p>
                )}
                <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                    <div className="min-w-0 space-y-6">
                        <section
                            className={groupCardClass}
                            aria-labelledby="shared-reading"
                        >
                            <h2
                                id="shared-reading"
                                className="flex items-center gap-2 text-lg font-semibold"
                            >
                                <BookOpenCheck
                                    className="text-primary size-5"
                                    aria-hidden="true"
                                />
                                Read together
                            </h2>
                            {sharedPlan ? (
                                <>
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <h3 className="text-xl font-semibold break-words">
                                            {sharedPlan.name}
                                        </h3>
                                        <span className="bg-muted rounded-full px-3 py-1 text-xs">
                                            {sharedPlan.complete
                                                ? 'Completed'
                                                : `Reading ${sharedPlan.currentDay} of ${sharedPlan.totalDays}`}
                                        </span>
                                    </div>
                                    {sharedPlan.complete ? (
                                        <p
                                            role="status"
                                            className="bg-primary/10 text-primary rounded-lg p-4 text-sm"
                                        >
                                            You reached the end of this shared
                                            plan. Take a moment to reflect
                                            together.
                                        </p>
                                    ) : (
                                        <>
                                            <ul className="divide-y">
                                                {sharedPlan.readings.map(
                                                    (reading) => (
                                                        <li
                                                            key={
                                                                reading.reference
                                                            }
                                                            className="flex items-center justify-between gap-3 py-3"
                                                        >
                                                            <Link
                                                                href={
                                                                    reading.url
                                                                }
                                                                className="text-primary min-w-0 text-sm font-medium break-words hover:underline"
                                                            >
                                                                {
                                                                    reading.reference
                                                                }
                                                            </Link>
                                                            <span className="text-muted-foreground flex shrink-0 items-center gap-1 text-xs">
                                                                {reading.isRead && (
                                                                    <Check
                                                                        className="text-primary size-4"
                                                                        aria-hidden="true"
                                                                    />
                                                                )}
                                                                {reading.isRead
                                                                    ? 'Logged by you'
                                                                    : 'To read'}
                                                            </span>
                                                        </li>
                                                    ),
                                                )}
                                            </ul>
                                            <p className="text-muted-foreground text-sm leading-relaxed">
                                                Log these chapters in your own
                                                journal, then choose to share a
                                                check-in. Chapters logged from
                                                the start of this group plan
                                                count.
                                            </p>
                                            <Button
                                                disabled={
                                                    busy ||
                                                    !sharedPlan.canCheckIn ||
                                                    sharedPlan.checkedIn
                                                }
                                                onClick={() =>
                                                    action.submit(
                                                        'check-in',
                                                        'post',
                                                        `${base}/check-in`,
                                                        {
                                                            run_id: sharedPlan.id,
                                                            expected_day:
                                                                sharedPlan.currentDay,
                                                        },
                                                        'Your check-in is shared with this group.',
                                                    )
                                                }
                                            >
                                                <Check
                                                    className="size-4"
                                                    aria-hidden="true"
                                                />
                                                {sharedPlan.checkedIn
                                                    ? 'Checked in'
                                                    : 'Share my check-in'}
                                            </Button>
                                        </>
                                    )}
                                    <div className="bg-muted/50 rounded-lg p-3 text-sm">
                                        <p className="font-medium">
                                            {sharedPlan.checkins.length} checked
                                            in
                                            {sharedPlan.complete
                                                ? ' for the final reading'
                                                : ' for this reading'}
                                        </p>
                                        <p className="text-muted-foreground mt-1 break-words">
                                            {sharedPlan.checkins.length
                                                ? sharedPlan.checkins
                                                      .map(
                                                          (person) =>
                                                              person.name,
                                                      )
                                                      .join(', ')
                                                : 'Everyone can check in at their own pace.'}
                                        </p>
                                    </div>
                                    {permissions.manage &&
                                        !sharedPlan.complete && (
                                            <div className="space-y-2 border-t pt-4">
                                                <p className="text-muted-foreground text-sm">
                                                    When your group is ready,
                                                    move everyone to the next
                                                    reading. Personal reading
                                                    progress stays unchanged.
                                                </p>
                                                <Button
                                                    variant="outline"
                                                    disabled={busy}
                                                    onClick={() => {
                                                        if (
                                                            window.confirm(
                                                                'Move the group to the next reading? Members who have not checked in can continue reading in their own time.',
                                                            )
                                                        )
                                                            action.submit(
                                                                'advance',
                                                                'post',
                                                                `${base}/advance`,
                                                                {
                                                                    run_id: sharedPlan.id,
                                                                    expected_day:
                                                                        sharedPlan.currentDay,
                                                                },
                                                                'Group reading updated.',
                                                            );
                                                    }}
                                                >
                                                    {sharedPlan.currentDay ===
                                                    sharedPlan.totalDays
                                                        ? 'Finish shared plan'
                                                        : 'Next group reading'}
                                                </Button>
                                            </div>
                                        )}
                                </>
                            ) : (
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    A group manager can choose a guided plan.
                                    You can already discuss any passage below.
                                </p>
                            )}
                            {permissions.manage && (
                                <details className="border-t pt-4">
                                    <summary className="text-primary cursor-pointer text-sm font-medium">
                                        {sharedPlan
                                            ? 'Choose a new shared plan'
                                            : 'Choose a shared plan'}
                                    </summary>
                                    <div className="mt-4 space-y-3">
                                        <p className="text-muted-foreground text-sm leading-relaxed">
                                            Start at reading one. Earlier runs
                                            and check-ins are kept. This does
                                            not enroll or reset anyone’s
                                            personal plan.
                                        </p>
                                        {availablePlans.length ? (
                                            <GroupForm
                                                url={`${base}/reading-plan`}
                                                label="Start shared plan"
                                                disabled={busy}
                                                onBusy={setFormBusy}
                                            >
                                                <input
                                                    key={planToken}
                                                    type="hidden"
                                                    name="creation_token"
                                                    defaultValue={planToken}
                                                />
                                                <div className="space-y-2">
                                                    <Label htmlFor="shared-plan-choice">
                                                        Guided plan
                                                    </Label>
                                                    <select
                                                        id="shared-plan-choice"
                                                        name="reading_plan_id"
                                                        className={
                                                            groupInputClass
                                                        }
                                                        defaultValue=""
                                                        required
                                                    >
                                                        <option
                                                            value=""
                                                            disabled
                                                        >
                                                            Choose a plan
                                                        </option>
                                                        {availablePlans.map(
                                                            (plan) => (
                                                                <option
                                                                    key={
                                                                        plan.id
                                                                    }
                                                                    value={
                                                                        plan.id
                                                                    }
                                                                >
                                                                    {plan.name}{' '}
                                                                    ·{' '}
                                                                    {
                                                                        plan.readings
                                                                    }{' '}
                                                                    readings
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                </div>
                                            </GroupForm>
                                        ) : (
                                            <p className="text-muted-foreground text-sm">
                                                No guided plans are available
                                                yet.
                                            </p>
                                        )}
                                    </div>
                                </details>
                            )}
                        </section>
                        <section
                            className={groupCardClass}
                            aria-labelledby="discussions"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <h2
                                    id="discussions"
                                    className="flex items-center gap-2 text-lg font-semibold"
                                >
                                    <MessageSquare
                                        className="text-primary size-5"
                                        aria-hidden="true"
                                    />
                                    Passage discussions
                                </h2>
                                {group.locked && (
                                    <span className="text-muted-foreground text-xs">
                                        Member posting paused
                                    </span>
                                )}
                            </div>
                            {permissions.post ? (
                                <GroupForm
                                    url={`${base}/posts`}
                                    label="Share with group"
                                    disabled={busy}
                                    onBusy={setFormBusy}
                                    resetFields={['body']}
                                >
                                    <input
                                        key={postToken}
                                        type="hidden"
                                        name="post_token"
                                        defaultValue={postToken}
                                    />
                                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_7rem]">
                                        <div className="space-y-2">
                                            <Label htmlFor="discussion-book">
                                                Passage book
                                            </Label>
                                            <select
                                                id="discussion-book"
                                                name="book_id"
                                                className={groupInputClass}
                                                value={postBook}
                                                onChange={(event) =>
                                                    setPostBook(
                                                        event.target.value,
                                                    )
                                                }
                                            >
                                                {books.map((book) => (
                                                    <option
                                                        key={book.id}
                                                        value={book.id}
                                                    >
                                                        {book.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="discussion-chapter">
                                                Chapter
                                            </Label>
                                            <input
                                                key={postBook}
                                                id="discussion-chapter"
                                                className={groupInputClass}
                                                name="chapter"
                                                type="number"
                                                required
                                                min={1}
                                                max={chapterMax}
                                                defaultValue={1}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="discussion-body">
                                            Your reflection
                                        </Label>
                                        <textarea
                                            id="discussion-body"
                                            name="body"
                                            className={groupInputClass}
                                            rows={4}
                                            required
                                            maxLength={2000}
                                            placeholder="What stood out in this passage?"
                                        />
                                        <p className="text-muted-foreground text-xs leading-relaxed">
                                            Up to 2,000 characters. This
                                            reflection is visible to all group
                                            members. Share personal details
                                            thoughtfully.
                                        </p>
                                    </div>
                                </GroupForm>
                            ) : (
                                <p className="bg-muted text-muted-foreground rounded-lg p-3 text-sm">
                                    A manager has paused member posting. You can
                                    still read discussions and check in.
                                </p>
                            )}
                            <DiscussionFilters
                                key={JSON.stringify(filters)}
                                base={base}
                                books={books}
                                filters={filters}
                                disabled={busy}
                            />
                            <div className="divide-y">
                                {posts.data.length ? (
                                    posts.data.map((post) => (
                                        <article
                                            key={post.id}
                                            className="space-y-3 py-5"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium break-words">
                                                        {post.author}
                                                    </p>
                                                    <time
                                                        dateTime={
                                                            post.createdAt
                                                        }
                                                        className="text-muted-foreground text-xs"
                                                    >
                                                        {new Date(
                                                            post.createdAt,
                                                        ).toLocaleString()}
                                                    </time>
                                                </div>
                                                <Link
                                                    href={post.url}
                                                    className="text-primary shrink-0 text-sm font-medium hover:underline"
                                                >
                                                    {post.reference}
                                                </Link>
                                            </div>
                                            {post.removed ? (
                                                <p className="text-muted-foreground text-sm italic">
                                                    {post.removedByModerator
                                                        ? 'This reflection was removed by a moderator.'
                                                        : 'This reflection was removed by its author.'}
                                                </p>
                                            ) : (
                                                <p className="text-sm leading-relaxed [overflow-wrap:anywhere] break-words whitespace-pre-wrap">
                                                    {post.body}
                                                </p>
                                            )}
                                            {post.canRemove && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    disabled={busy}
                                                    aria-label={`Remove reflection by ${post.author}`}
                                                    onClick={() => {
                                                        if (
                                                            window.confirm(
                                                                'Permanently remove this reflection? Its text will be deleted.',
                                                            )
                                                        )
                                                            action.submit(
                                                                `post-${post.id}`,
                                                                'delete',
                                                                `${base}/posts/${post.id}`,
                                                                {},
                                                                'Reflection removed.',
                                                            );
                                                    }}
                                                >
                                                    Remove
                                                </Button>
                                            )}
                                        </article>
                                    ))
                                ) : (
                                    <p className="text-muted-foreground py-6 text-center text-sm">
                                        {filters.book
                                            ? 'No reflections match this passage yet.'
                                            : 'Start the conversation with a passage and a reflection.'}
                                    </p>
                                )}
                            </div>
                            <GroupPagination
                                page={posts}
                                label="Discussion pages"
                            />
                        </section>
                    </div>
                    <aside
                        className="min-w-0 space-y-6"
                        aria-label="Group members and settings"
                    >
                        <section className={groupCardClass}>
                            <h2 className="flex items-center gap-2 text-lg font-semibold">
                                <UsersRound
                                    className="text-primary size-5"
                                    aria-hidden="true"
                                />
                                Members{' '}
                                <span className="text-muted-foreground">
                                    ({members.length})
                                </span>
                            </h2>
                            <ul className="divide-y">
                                {members.map((member) => (
                                    <li
                                        key={member.id}
                                        className="space-y-2 py-3 first:pt-0"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <span className="min-w-0 text-sm font-medium break-words">
                                                {member.name}
                                            </span>
                                            <span className="text-muted-foreground text-xs capitalize">
                                                {member.role}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {permissions.owner &&
                                                member.role !== 'owner' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        disabled={busy}
                                                        onClick={() => {
                                                            if (
                                                                window.confirm(
                                                                    `${member.role === 'admin' ? 'Remove admin access from' : 'Give admin access to'} ${member.name}? Admins can invite, moderate and move the shared reading forward.`,
                                                                )
                                                            )
                                                                action.submit(
                                                                    `role-${member.id}`,
                                                                    'patch',
                                                                    `${base}/members/${member.id}`,
                                                                    {
                                                                        role:
                                                                            member.role ===
                                                                            'admin'
                                                                                ? 'member'
                                                                                : 'admin',
                                                                    },
                                                                    'Member role updated.',
                                                                );
                                                        }}
                                                    >
                                                        {member.role === 'admin'
                                                            ? 'Make member'
                                                            : 'Make admin'}
                                                    </Button>
                                                )}
                                            {member.canRemove && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    disabled={busy}
                                                    onClick={() => {
                                                        if (
                                                            window.confirm(
                                                                `Remove ${member.name} from this group? Their existing posts and check-ins remain.`,
                                                            )
                                                        )
                                                            action.submit(
                                                                `member-${member.id}`,
                                                                'delete',
                                                                `${base}/members/${member.id}`,
                                                                {},
                                                                'Member removed.',
                                                            );
                                                    }}
                                                >
                                                    Remove member
                                                </Button>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            {permissions.owner ? (
                                <p className="text-muted-foreground text-xs leading-relaxed">
                                    To leave, transfer ownership to another
                                    member or delete the group.
                                </p>
                            ) : (
                                <div className="space-y-2 border-t pt-4">
                                    <p className="text-muted-foreground text-xs">
                                        Your existing reflections and check-ins
                                        remain if you leave.
                                    </p>
                                    <Button
                                        variant="outline"
                                        disabled={busy}
                                        onClick={() => {
                                            if (
                                                window.confirm(
                                                    'Leave this group? Your existing reflections and check-ins remain. You will need a new invitation to rejoin.',
                                                )
                                            )
                                                action.submit(
                                                    'leave',
                                                    'post',
                                                    `${base}/leave`,
                                                    {},
                                                    'You left the group.',
                                                );
                                        }}
                                    >
                                        Leave group
                                    </Button>
                                </div>
                            )}
                        </section>
                        {permissions.manage && (
                            <>
                                <section className={groupCardClass}>
                                    <h2 className="text-lg font-semibold">
                                        Invite connections
                                    </h2>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        Invitations appear in the recipient’s
                                        Reading groups inbox and expire after
                                        seven days.
                                    </p>
                                    {inviteCandidates.length ? (
                                        <GroupForm
                                            url={`${base}/invitations`}
                                            label="Send invitation"
                                            disabled={busy}
                                            onBusy={setFormBusy}
                                            resetFields={['recipient_id']}
                                        >
                                            <div className="space-y-2">
                                                <Label htmlFor="invite-recipient">
                                                    Verified connection
                                                </Label>
                                                <select
                                                    id="invite-recipient"
                                                    name="recipient_id"
                                                    className={groupInputClass}
                                                    required
                                                    defaultValue=""
                                                >
                                                    <option value="" disabled>
                                                        Choose a connection
                                                    </option>
                                                    {inviteCandidates.map(
                                                        (person) => (
                                                            <option
                                                                key={person.id}
                                                                value={
                                                                    person.id
                                                                }
                                                            >
                                                                {person.name}
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                            </div>
                                        </GroupForm>
                                    ) : (
                                        <p className="text-muted-foreground text-sm">
                                            No eligible connections yet. Connect
                                            with a verified reader on the{' '}
                                            <Link
                                                href="/members"
                                                className="text-primary underline"
                                            >
                                                Members page
                                            </Link>{' '}
                                            first.
                                        </p>
                                    )}
                                    {invitations.length > 0 && (
                                        <ul className="divide-y">
                                            {invitations.map((invite) => (
                                                <li
                                                    key={invite.id}
                                                    className="flex items-start justify-between gap-2 py-3"
                                                >
                                                    <div className="min-w-0 text-sm">
                                                        <p className="font-medium break-words">
                                                            {invite.name}
                                                        </p>
                                                        <p className="text-muted-foreground text-xs">
                                                            {invite.expired
                                                                ? 'Expired — invite again to renew'
                                                                : `Pending · expires ${new Date(invite.expiresAt).toLocaleDateString()}`}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        disabled={busy}
                                                        onClick={() =>
                                                            action.submit(
                                                                `revoke-${invite.id}`,
                                                                'delete',
                                                                `${base}/invitations/${invite.id}`,
                                                                {},
                                                                'Invitation revoked.',
                                                            )
                                                        }
                                                    >
                                                        Revoke
                                                    </Button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </section>
                                <section className={groupCardClass}>
                                    <h2 className="flex items-center gap-2 text-lg font-semibold">
                                        <ShieldCheck
                                            className="text-primary size-5"
                                            aria-hidden="true"
                                        />
                                        Moderation
                                    </h2>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        Owners and admins can remove reflections
                                        and pause member posting. Managers can
                                        still post while it is paused.
                                    </p>
                                    <Button
                                        variant="outline"
                                        disabled={busy}
                                        onClick={() =>
                                            action.submit(
                                                'lock',
                                                'patch',
                                                `${base}/discussion-lock`,
                                                {
                                                    discussions_locked:
                                                        !group.locked,
                                                },
                                                group.locked
                                                    ? 'Member posting resumed.'
                                                    : 'Member posting paused.',
                                            )
                                        }
                                    >
                                        {group.locked
                                            ? 'Resume member posting'
                                            : 'Pause member posting'}
                                    </Button>
                                </section>
                            </>
                        )}
                        {permissions.owner && (
                            <section className={groupCardClass}>
                                <h2 className="text-lg font-semibold">
                                    Owner settings
                                </h2>
                                <details>
                                    <summary className="text-primary cursor-pointer text-sm font-medium">
                                        Edit group details
                                    </summary>
                                    <div className="mt-4">
                                        <GroupForm
                                            url={base}
                                            method="patch"
                                            label="Save group details"
                                            disabled={busy}
                                            onBusy={setFormBusy}
                                        >
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-group-name">
                                                    Group name
                                                </Label>
                                                <input
                                                    id="edit-group-name"
                                                    name="name"
                                                    className={groupInputClass}
                                                    defaultValue={group.name}
                                                    maxLength={80}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-group-description">
                                                    Description
                                                </Label>
                                                <textarea
                                                    id="edit-group-description"
                                                    name="description"
                                                    className={groupInputClass}
                                                    defaultValue={
                                                        group.description ?? ''
                                                    }
                                                    maxLength={500}
                                                    rows={3}
                                                />
                                            </div>
                                        </GroupForm>
                                    </div>
                                </details>
                                <details className="border-t pt-4">
                                    <summary className="text-primary cursor-pointer text-sm font-medium">
                                        Transfer ownership
                                    </summary>
                                    <div className="mt-4 space-y-3">
                                        <p className="text-muted-foreground text-sm">
                                            The chosen member becomes owner. You
                                            remain an admin.
                                        </p>
                                        {members.length > 1 ? (
                                            <GroupForm
                                                url={`${base}/ownership`}
                                                label="Transfer ownership"
                                                disabled={busy}
                                                onBusy={setFormBusy}
                                            >
                                                <div className="space-y-2">
                                                    <Label htmlFor="next-owner">
                                                        New owner
                                                    </Label>
                                                    <select
                                                        id="next-owner"
                                                        name="user_id"
                                                        className={
                                                            groupInputClass
                                                        }
                                                        required
                                                        defaultValue=""
                                                    >
                                                        <option
                                                            value=""
                                                            disabled
                                                        >
                                                            Choose a member
                                                        </option>
                                                        {members
                                                            .filter(
                                                                (member) =>
                                                                    member.role !==
                                                                    'owner',
                                                            )
                                                            .map((member) => (
                                                                <option
                                                                    key={
                                                                        member.id
                                                                    }
                                                                    value={
                                                                        member.id
                                                                    }
                                                                >
                                                                    {
                                                                        member.name
                                                                    }
                                                                </option>
                                                            ))}
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="transfer-confirm">
                                                        Type {group.name} to
                                                        confirm
                                                    </Label>
                                                    <input
                                                        id="transfer-confirm"
                                                        name="confirmation"
                                                        className={
                                                            groupInputClass
                                                        }
                                                        required
                                                        autoComplete="off"
                                                    />
                                                </div>
                                            </GroupForm>
                                        ) : (
                                            <p className="text-muted-foreground text-sm">
                                                Invite another member before
                                                transferring ownership.
                                            </p>
                                        )}
                                    </div>
                                </details>
                                <details className="border-t pt-4">
                                    <summary className="text-destructive cursor-pointer text-sm font-medium">
                                        Delete group
                                    </summary>
                                    <div className="mt-4 space-y-3">
                                        <p className="text-muted-foreground text-sm leading-relaxed">
                                            Permanently delete this group, its
                                            reflections, invitations and
                                            check-ins. Members’ personal
                                            journals and plans stay unchanged.
                                        </p>
                                        <GroupForm
                                            url={base}
                                            method="delete"
                                            label="Permanently delete group"
                                            destructive
                                            disabled={busy}
                                            onBusy={setFormBusy}
                                        >
                                            <div className="space-y-2">
                                                <Label htmlFor="delete-confirm">
                                                    Type {group.name} to confirm
                                                </Label>
                                                <input
                                                    id="delete-confirm"
                                                    name="confirmation"
                                                    className={groupInputClass}
                                                    required
                                                    autoComplete="off"
                                                />
                                            </div>
                                        </GroupForm>
                                    </div>
                                </details>
                            </section>
                        )}
                    </aside>
                </div>
            </main>
        </>
    );
}

function DiscussionFilters({
    base,
    books,
    filters,
    disabled,
}: {
    base: string;
    books: BibleBook[];
    filters: Props['filters'];
    disabled: boolean;
}) {
    const [bookId, setBookId] = useState(filters.book ?? '');
    const [chapter, setChapter] = useState(String(filters.chapter ?? ''));
    return (
        <form
            className="space-y-3 border-t pt-4"
            onSubmit={(event) => {
                event.preventDefault();
                router.get(
                    base,
                    {
                        ...(bookId ? { book: bookId } : {}),
                        ...(bookId && chapter ? { chapter } : {}),
                    },
                    { preserveState: true, preserveScroll: true },
                );
            }}
        >
            <p className="text-sm font-medium">Find a passage discussion</p>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_7rem_auto]">
                <div className="space-y-2">
                    <Label htmlFor="filter-book">Book</Label>
                    <select
                        id="filter-book"
                        className={groupInputClass}
                        disabled={disabled}
                        value={bookId}
                        onChange={(event) => {
                            setBookId(event.target.value);
                            setChapter('');
                        }}
                    >
                        <option value="">All books</option>
                        {books.map((book) => (
                            <option key={book.id} value={book.id}>
                                {book.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="filter-chapter">Chapter</Label>
                    <input
                        id="filter-chapter"
                        className={groupInputClass}
                        disabled={disabled || !bookId}
                        type="number"
                        min={1}
                        max={
                            books.find((book) => book.id === bookId)
                                ?.chapters ?? 150
                        }
                        value={chapter}
                        onChange={(event) => setChapter(event.target.value)}
                    />
                </div>
                <Button
                    type="submit"
                    variant="outline"
                    disabled={disabled}
                    className="self-end"
                >
                    Filter
                </Button>
            </div>
        </form>
    );
}
