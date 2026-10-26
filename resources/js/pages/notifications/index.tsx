import { Head, router } from '@inertiajs/react';
import { Bell, Check, UserRoundPlus } from 'lucide-react';
import { dashboard } from '@/routes';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { update as updateConnection } from '@/actions/App/Http/Controllers/ConnectionRequestController';
import { update as markNotificationRead } from '@/actions/App/Http/Controllers/NotificationController';
import { index as notificationsIndex } from '@/actions/App/Http/Controllers/NotificationController';

type NotificationItem = {
    id: string;
    read_at: string | null;
    created_at: string;
    data: {
        kind?: string;
        message?: string;
        connection_request_id?: number;
        sender_id?: number;
    };
};

type PaginatedNotifications = {
    data: NotificationItem[];
    links: { url: string | null; label: string; active: boolean }[];
};

export default function NotificationsIndex({ notifications, unreadCount }: { notifications: PaginatedNotifications; unreadCount: number }) {
    return (
        <>
            <Head title="Notifications" />
            <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 p-4 md:p-8">
                <header className="flex items-end justify-between gap-4">
                    <div className="space-y-2">
                        <p className="text-sm font-medium tracking-wide text-primary">YOUR COMMUNITY</p>
                        <h1 className="text-3xl font-semibold tracking-tight">Notifications</h1>
                        <p className="text-muted-foreground">Connection requests and updates from your members.</p>
                    </div>
                    {unreadCount > 0 && <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">{unreadCount} unread</span>}
                </header>

                {notifications.data.length ? (
                    <section className="flex flex-col gap-3">
                        {notifications.data.map((notification) => (
                            <Card key={notification.id} className={notification.read_at ? 'border-border/70' : 'border-primary/30 bg-primary/[0.03]'}>
                                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                        {notification.data.kind === 'connection_request' ? <UserRoundPlus className="size-5" /> : <Bell className="size-5" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium">{notification.data.message ?? 'You have a new notification.'}</p>
                                        <p className="mt-1 text-sm text-muted-foreground">{new Date(notification.created_at).toLocaleString()}</p>
                                    </div>
                                    {!notification.read_at && (
                                        <Button variant="ghost" size="sm" onClick={() => router.patch(markNotificationRead(notification.id).url)}>
                                            <Check /> Mark read
                                        </Button>
                                    )}
                                    {notification.data.kind === 'connection_request' && !notification.read_at && notification.data.connection_request_id && (
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={() => router.patch(updateConnection(notification.data.connection_request_id!).url, { status: 'accepted' })}>Accept</Button>
                                            <Button size="sm" variant="outline" onClick={() => router.patch(updateConnection(notification.data.connection_request_id!).url, { status: 'declined' })}>Decline</Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </section>
                ) : (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                            <Bell className="size-10 text-muted-foreground" />
                            <h2 className="text-lg font-semibold">You’re all caught up</h2>
                            <p className="text-sm text-muted-foreground">New connection requests and updates will show up here.</p>
                        </CardContent>
                    </Card>
                )}

                {notifications.links.length > 3 && (
                    <nav className="flex flex-wrap justify-center gap-2" aria-label="Notification pages">
                        {notifications.links.map((link) => (
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

NotificationsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Notifications', href: notificationsIndex() },
    ],
};