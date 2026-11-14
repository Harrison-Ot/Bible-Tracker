import { Head, Link, useForm } from '@inertiajs/react';
import { MessageCircle, Send, UsersRound } from 'lucide-react';
import { useEffect, useRef, type FormEvent } from 'react';
import { store as sendMessage } from '@/actions/App/Http/Controllers/ChatController';
import { index as chatsIndex } from '@/actions/App/Http/Controllers/ChatController';
import { dashboard } from '@/routes';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

type Connection = {
    id: number;
    name: string;
    avatarUrl: string | null;
};

type Message = {
    id: number;
    senderId: number;
    senderName: string;
    body: string;
    sentAt: string;
};

type ChatProps = {
    connections: Connection[];
    selectedConnectionId: number | null;
    messages: Message[];
    auth: { user: { id: number } };
    errors?: { body?: string };
};

export default function ChatsIndex({
    connections,
    selectedConnectionId,
    messages,
    auth,
    errors,
}: ChatProps) {
    const selected = connections.find(
        (connection) => connection.id === selectedConnectionId,
    );
    const { data, setData, post, processing, reset } = useForm({ body: '' });
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selected) return;

        post(sendMessage(selected.id).url, {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    return (
        <>
            <Head title="Chats" />
            <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-8">
                <header className="space-y-2">
                    <p className="text-primary flex items-center gap-2 text-sm font-semibold tracking-[0.16em] uppercase">
                        <MessageCircle className="size-4" /> Stay connected
                    </p>
                    <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                        Your chats
                    </h1>
                    <p className="text-muted-foreground">
                        Private conversations with people you’ve connected with.
                    </p>
                </header>

                <Card className="grid min-h-[min(70vh,680px)] grid-cols-1 overflow-hidden md:grid-cols-[280px_minmax(0,1fr)]">
                    <aside className="bg-muted/20 min-w-0 border-b md:border-r md:border-b-0">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <UsersRound className="size-4" /> Connected
                                people
                            </CardTitle>
                            <CardDescription>
                                {connections.length}{' '}
                                {connections.length === 1
                                    ? 'connection'
                                    : 'connections'}
                            </CardDescription>
                        </CardHeader>
                        <div className="flex max-h-56 flex-col gap-1 overflow-y-auto px-3 pb-3 md:max-h-[590px]">
                            {connections.map((connection) => (
                                <Link
                                    key={connection.id}
                                    href={chatsIndex.url({
                                        query: { with: connection.id },
                                    })}
                                    className={`hover:bg-muted flex min-w-0 items-center gap-3 rounded-lg px-3 py-3 transition-colors ${selected?.id === connection.id ? 'bg-primary/10 text-primary' : 'text-foreground'}`}
                                >
                                    {connection.avatarUrl ? (
                                        <img
                                            src={connection.avatarUrl}
                                            alt=""
                                            className="size-10 shrink-0 rounded-full object-cover"
                                        />
                                    ) : (
                                        <span className="bg-primary/10 text-primary grid size-10 shrink-0 place-items-center rounded-full font-semibold">
                                            {connection.name
                                                .slice(0, 1)
                                                .toUpperCase()}
                                        </span>
                                    )}
                                    <span className="truncate text-sm font-medium">
                                        {connection.name}
                                    </span>
                                </Link>
                            ))}
                            {connections.length === 0 && (
                                <div className="text-muted-foreground px-3 py-5 text-sm">
                                    <p>You don’t have any connections yet.</p>
                                    <Link
                                        href="/members"
                                        className="text-primary mt-2 inline-block font-medium underline-offset-4 hover:underline"
                                    >
                                        Find people to connect with
                                    </Link>
                                </div>
                            )}
                        </div>
                    </aside>

                    <section className="flex min-h-[440px] min-w-0 flex-col">
                        {selected ? (
                            <>
                                <div className="flex items-center gap-3 border-b px-5 py-4">
                                    {selected.avatarUrl ? (
                                        <img
                                            src={selected.avatarUrl}
                                            alt=""
                                            className="size-10 shrink-0 rounded-full object-cover"
                                        />
                                    ) : (
                                        <span className="bg-primary/10 text-primary grid size-10 shrink-0 place-items-center rounded-full font-semibold">
                                            {selected.name
                                                .slice(0, 1)
                                                .toUpperCase()}
                                        </span>
                                    )}
                                    <div className="min-w-0">
                                        <h2 className="font-semibold break-words">
                                            {selected.name}
                                        </h2>
                                        <p className="text-muted-foreground text-xs">
                                            Connected
                                        </p>
                                    </div>
                                </div>
                                <div className="flex-1 space-y-3 overflow-y-auto p-5">
                                    {messages.length ? (
                                        messages.map((message) => {
                                            const isMine =
                                                message.senderId ===
                                                auth.user.id;
                                            return (
                                                <div
                                                    key={message.id}
                                                    className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div
                                                        className={`max-w-[85%] min-w-0 rounded-2xl px-4 py-3 sm:max-w-[70%] ${isMine ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                                                    >
                                                        <p className="text-sm break-words whitespace-pre-wrap">
                                                            {message.body}
                                                        </p>
                                                        <time
                                                            className={`mt-1 block text-right text-[11px] ${isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}
                                                        >
                                                            {new Date(
                                                                message.sentAt,
                                                            ).toLocaleString(
                                                                [],
                                                                {
                                                                    dateStyle:
                                                                        'medium',
                                                                    timeStyle:
                                                                        'short',
                                                                },
                                                            )}
                                                        </time>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="grid h-full min-h-48 place-items-center text-center">
                                            <div className="space-y-2">
                                                <MessageCircle className="text-muted-foreground/60 mx-auto size-8" />
                                                <p className="font-medium">
                                                    Start a conversation
                                                </p>
                                                <p className="text-muted-foreground text-sm">
                                                    Send {selected.name} a
                                                    message below.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                                <form
                                    onSubmit={submit}
                                    className="border-t p-4"
                                >
                                    {errors?.body && (
                                        <p
                                            id="message-error"
                                            role="alert"
                                            className="mb-2 text-sm text-red-700 dark:text-red-400"
                                        >
                                            {errors.body}
                                        </p>
                                    )}
                                    <div className="flex items-end gap-3">
                                        <textarea
                                            value={data.body}
                                            onChange={(event) =>
                                                setData(
                                                    'body',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder={`Message ${selected.name}…`}
                                            maxLength={2000}
                                            rows={2}
                                            className="border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 max-h-36 min-h-12 min-w-0 flex-1 resize-y rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                                            aria-label="Message"
                                            aria-invalid={Boolean(errors?.body)}
                                            aria-describedby={
                                                errors?.body
                                                    ? 'message-error'
                                                    : undefined
                                            }
                                        />
                                        <Button
                                            type="submit"
                                            size="icon"
                                            aria-label="Send message"
                                            className="shrink-0"
                                            disabled={
                                                processing || !data.body.trim()
                                            }
                                        >
                                            <Send className="size-4" />
                                        </Button>
                                    </div>
                                </form>
                            </>
                        ) : (
                            <div className="grid flex-1 place-items-center p-8 text-center">
                                <div className="max-w-sm space-y-3">
                                    <span className="bg-primary/10 text-primary mx-auto grid size-14 place-items-center rounded-full">
                                        <MessageCircle className="size-6" />
                                    </span>
                                    <h2 className="text-lg font-semibold">
                                        Choose a conversation
                                    </h2>
                                    <p className="text-muted-foreground text-sm">
                                        Select someone from your connections to
                                        view your messages and chat.
                                    </p>
                                </div>
                            </div>
                        )}
                    </section>
                </Card>
            </main>
        </>
    );
}

ChatsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Chats', href: chatsIndex() },
    ],
};
