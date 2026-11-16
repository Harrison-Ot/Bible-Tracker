import { Head, Link } from '@inertiajs/react';
import { LockKeyhole, Plus, UsersRound } from 'lucide-react';
import { useState } from 'react';
import {
    GroupForm,
    GroupPagination,
    groupCardClass,
    groupInputClass,
} from '@/components/group-form';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useActionRequest } from '@/hooks/use-action-request';
import type { GroupPage, GroupRole } from '@/types/groups';

type GroupSummary = {
    id: number;
    name: string;
    description: string | null;
    membersCount: number;
    role: GroupRole;
};
type Invitation = {
    id: number;
    groupName: string;
    description: string | null;
    inviterName: string;
    expiresAt: string;
};
export default function Groups({
    groups,
    invitations,
    creationToken,
}: {
    groups: GroupPage<GroupSummary>;
    invitations: GroupPage<Invitation>;
    creationToken: string;
}) {
    const [creating, setCreating] = useState(false);
    const [formBusy, setFormBusy] = useState(false);
    const action = useActionRequest();
    const busy = formBusy || action.pending !== null;
    return (
        <>
            <Head title="Reading groups" />
            <main className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
                <header className="flex flex-wrap items-start justify-between gap-4">
                    <div className="max-w-2xl space-y-2">
                        <p className="text-primary flex items-center gap-2 text-sm font-medium">
                            <LockKeyhole
                                className="size-4"
                                aria-hidden="true"
                            />
                            A shared rhythm, a private space
                        </p>
                        <h1 className="text-3xl font-semibold tracking-tight">
                            Reading groups
                        </h1>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Read together, discuss a passage and choose when to
                            share a check-in. Your journal, notes and saved
                            verses stay private.
                        </p>
                    </div>
                    <Button
                        onClick={() => setCreating(!creating)}
                        disabled={busy}
                        aria-expanded={creating}
                        aria-controls="create-group"
                    >
                        <Plus className="size-4" />
                        {creating ? 'Close form' : 'Create a group'}
                    </Button>
                </header>
                {action.feedback && (
                    <p
                        role={action.feedback.error ? 'alert' : 'status'}
                        className={
                            action.feedback.error
                                ? 'text-destructive text-sm'
                                : 'text-primary text-sm'
                        }
                    >
                        {action.feedback.message}
                    </p>
                )}
                {creating && (
                    <section id="create-group" className={groupCardClass}>
                        <h2 className="text-lg font-semibold">
                            Start a private group
                        </h2>
                        <p className="text-muted-foreground text-sm">
                            You become the owner. Invite verified connections
                            after creating your group.
                        </p>
                        <GroupForm
                            url="/groups"
                            label="Create private group"
                            disabled={busy}
                            onBusy={setFormBusy}
                        >
                            <input
                                type="hidden"
                                name="creation_token"
                                defaultValue={creationToken}
                            />
                            <div className="space-y-2">
                                <Label htmlFor="group-name">Group name</Label>
                                <input
                                    className={groupInputClass}
                                    id="group-name"
                                    name="name"
                                    required
                                    maxLength={80}
                                    placeholder="Sunday reading circle"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="group-description">
                                    Description (optional)
                                </Label>
                                <textarea
                                    className={groupInputClass}
                                    id="group-description"
                                    name="description"
                                    maxLength={500}
                                    rows={3}
                                    placeholder="What will you read together?"
                                />
                            </div>
                        </GroupForm>
                    </section>
                )}
                {invitations.total > 0 && (
                    <section className={groupCardClass}>
                        <h2 className="text-lg font-semibold">
                            Your invitations{' '}
                            <span className="text-muted-foreground">
                                ({invitations.total})
                            </span>
                        </h2>
                        <ul className="divide-y">
                            {invitations.data.map((invite) => (
                                <li
                                    key={invite.id}
                                    className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0"
                                >
                                    <div className="min-w-0 flex-1 space-y-1 break-words">
                                        <h3 className="font-medium">
                                            {invite.groupName}
                                        </h3>
                                        <p className="text-muted-foreground text-sm">
                                            Invited by {invite.inviterName} ·
                                            Expires{' '}
                                            {new Date(
                                                invite.expiresAt,
                                            ).toLocaleDateString()}
                                        </p>
                                        {invite.description && (
                                            <p className="text-sm">
                                                {invite.description}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            disabled={busy}
                                            onClick={() =>
                                                action.submit(
                                                    `accept-${invite.id}`,
                                                    'patch',
                                                    `/group-invitations/${invite.id}`,
                                                    { status: 'accepted' },
                                                    'Invitation accepted.',
                                                )
                                            }
                                        >
                                            Accept
                                        </Button>
                                        <Button
                                            variant="outline"
                                            disabled={busy}
                                            onClick={() =>
                                                action.submit(
                                                    `decline-${invite.id}`,
                                                    'patch',
                                                    `/group-invitations/${invite.id}`,
                                                    { status: 'declined' },
                                                    'Invitation declined.',
                                                )
                                            }
                                        >
                                            Decline
                                        </Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <GroupPagination
                            page={invitations}
                            label="Invitation pages"
                        />
                    </section>
                )}
                <section className="space-y-4" aria-labelledby="your-groups">
                    <h2 id="your-groups" className="text-lg font-semibold">
                        Your groups{' '}
                        <span className="text-muted-foreground">
                            ({groups.total})
                        </span>
                    </h2>
                    {groups.data.length ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            {groups.data.map((group) => (
                                <Link
                                    key={group.id}
                                    href={`/groups/${group.id}`}
                                    className={`${groupCardClass} hover:border-primary focus-visible:ring-ring block transition-colors focus-visible:ring-2 focus-visible:outline-none`}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <UsersRound
                                            className="text-primary size-5"
                                            aria-hidden="true"
                                        />
                                        <span className="bg-muted rounded-full px-2.5 py-1 text-xs capitalize">
                                            {group.role}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold break-words">
                                            {group.name}
                                        </h3>
                                        {group.description && (
                                            <p className="text-muted-foreground mt-2 line-clamp-3 text-sm leading-relaxed break-words">
                                                {group.description}
                                            </p>
                                        )}
                                    </div>
                                    <p className="text-muted-foreground text-sm">
                                        {group.membersCount}{' '}
                                        {group.membersCount === 1
                                            ? 'member'
                                            : 'members'}{' '}
                                        · Private group
                                    </p>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className={`${groupCardClass} py-10 text-center`}>
                            <UsersRound
                                className="text-primary mx-auto size-8"
                                aria-hidden="true"
                            />
                            <h3 className="font-medium">
                                Find your reading rhythm together
                            </h3>
                            <p className="text-muted-foreground mx-auto max-w-md text-sm leading-relaxed">
                                Create a group or accept an invitation from a
                                connection. Only members can see a group’s
                                readings and discussions.
                            </p>
                        </div>
                    )}
                    <GroupPagination page={groups} label="Group pages" />
                </section>
            </main>
        </>
    );
}
