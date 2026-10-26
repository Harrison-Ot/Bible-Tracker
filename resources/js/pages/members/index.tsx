import { Head, router } from '@inertiajs/react';
import { Check, Clock3, UserPlus, UsersRound } from 'lucide-react';
import { dashboard } from '@/routes';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    store as storeConnection,
    update as updateConnection,
} from '@/actions/App/Http/Controllers/ConnectionRequestController';
import { index as membersIndex } from '@/actions/App/Http/Controllers/MemberController';

type Member = {
    id: number;
    name: string;
    avatarUrl: string | null;
    connectionStatus: 'none' | 'pending' | 'incoming' | 'connected';
    incomingRequestId: number | null;
};

type PaginatedMembers = {
    data: Member[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
};

export default function MembersIndex({ members }: { members: PaginatedMembers }) {
    const connect = (memberId: number) => router.post(storeConnection(memberId).url);
    const respond = (requestId: number, status: 'accepted' | 'declined') =>
        router.patch(updateConnection(requestId).url, { status });

    return (
        <>
            <Head title="Members" />
            <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-4 md:p-8">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-2">
                        <p className="text-sm font-medium tracking-wide text-primary">COMMUNITY</p>
                        <h1 className="text-3xl font-semibold tracking-tight">Meet your members</h1>
                        <p className="max-w-2xl text-muted-foreground">Find people growing in their Bible reading journey and connect with them. Chat will be available here in a future update.</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <UsersRound className="size-4" />
                        {members.total} members
                    </div>
                </header>

                {members.data.length ? (
                    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {members.data.map((member) => (
                            <Card key={member.id} className="border-border/70 shadow-sm">
                                <CardContent className="flex items-center gap-4 p-5">
                                    <Avatar className="size-14">
                                        <AvatarImage src={member.avatarUrl ?? undefined} alt={member.name} />
                                        <AvatarFallback>{member.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                        <h2 className="truncate font-semibold">{member.name}</h2>
                                        <p className="text-sm text-muted-foreground">Bible reading community</p>
                                    </div>
                                </CardContent>
                                <div className="flex gap-2 px-5 pb-5">
                                    {member.connectionStatus === 'none' && (
                                        <Button className="w-full" onClick={() => connect(member.id)}>
                                            <UserPlus /> Connect
                                        </Button>
                                    )}
                                    {member.connectionStatus === 'pending' && (
                                        <Button className="w-full" variant="secondary" disabled>
                                            <Clock3 /> Request sent
                                        </Button>
                                    )}
                                    {member.connectionStatus === 'connected' && (
                                        <Button className="w-full" variant="secondary" disabled>
                                            <Check /> Connected
                                        </Button>
                                    )}
                                    {member.connectionStatus === 'incoming' && member.incomingRequestId && (
                                        <>
                                            <Button className="flex-1" onClick={() => respond(member.incomingRequestId!, 'accepted')}>Accept</Button>
                                            <Button className="flex-1" variant="outline" onClick={() => respond(member.incomingRequestId!, 'declined')}>Decline</Button>
                                        </>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </section>
                ) : (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                            <UsersRound className="size-10 text-muted-foreground" />
                            <h2 className="text-lg font-semibold">You’re the first member here</h2>
                            <p className="text-sm text-muted-foreground">When more people join, they’ll appear here.</p>
                        </CardContent>
                    </Card>
                )}

                {members.links.length > 3 && (
                    <nav className="flex flex-wrap justify-center gap-2" aria-label="Member pages">
                        {members.links.map((link) => (
                            <Button key={link.label} variant={link.active ? 'default' : 'outline'} size="sm" disabled={!link.url} onClick={() => link.url && router.visit(link.url)}>
                                {link.label.replace(/<[^>]*>/g, '').replace('&laquo;', '«').replace('&raquo;', '»')}
                            </Button>
                        ))}
                    </nav>
                )}
            </main>
        </>
    );
}

MembersIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Members', href: membersIndex() },
    ],
};