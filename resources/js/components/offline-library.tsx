import { BookOpen, CloudUpload, Download, Trash2, WifiOff } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useOfflineStorage } from '@/hooks/use-offline-storage';
import {
    chapterBytes,
    chapterKey,
    clearChapters,
    DOWNLOAD_BYTES,
    DOWNLOAD_LIMIT,
    localToday,
    queueReading,
    removeChapter,
    removePending,
    resetOfflineData,
    setLoggingOwner,
} from '@/lib/offline-db';
import { syncReadings } from '@/lib/offline-sync';
const card = 'min-w-0 space-y-4 rounded-xl border bg-card p-5 shadow-sm sm:p-6';
const input =
    'min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm';
export default function OfflineLibrary({ ownerId }: { ownerId?: number }) {
    const { chapters, queue, enabledOwner, error, loaded } =
        useOfflineStorage(ownerId);
    const query = new URLSearchParams(
        typeof location === 'undefined' ? '' : location.search,
    );
    const path = (
        typeof location === 'undefined' ? '' : location.pathname
    ).match(/^\/bible\/([^/]+)\/(\d+)$/);
    const unsupportedTranslation =
        query.has('translation') && query.get('translation') !== 'web';
    const [selected, setSelected] = useState<string | null>(
        unsupportedTranslation
            ? null
            : query.has('book')
              ? chapterKey(
                    query.get('book') ?? '',
                    Number(query.get('chapter')),
                )
              : path
                ? chapterKey(path[1], Number(path[2]))
                : null,
    );
    const [readOn, setReadOn] = useState(localToday());
    const [fontSize, setFontSize] = useState(20);
    const [busy, setBusy] = useState(false);
    const lock = useRef(false);
    const [feedback, setFeedback] = useState<{
        error: boolean;
        message: string;
    } | null>(null);
    const current = chapters.find(
        (chapter) => chapterKey(chapter.bookId, chapter.chapter) === selected,
    );
    const publicReader = ownerId === undefined;
    const activeOwner = ownerId ?? enabledOwner;
    const totalBytes = chapters.reduce(
        (total, chapter) => total + chapterBytes(chapter),
        0,
    );
    const act = async (work: () => Promise<string>) => {
        if (lock.current) return;
        lock.current = true;
        setBusy(true);
        setFeedback(null);
        try {
            setFeedback({ error: false, message: await work() });
        } catch (failure) {
            setFeedback({
                error: true,
                message:
                    failure instanceof Error
                        ? failure.message
                        : 'This change could not be saved. Try again.',
            });
        } finally {
            lock.current = false;
            setBusy(false);
        }
    };
    return (
        <div className="space-y-6">
            {error && (
                <p
                    role="alert"
                    className="text-destructive rounded-lg border p-4 text-sm"
                >
                    {error}
                </p>
            )}
            {feedback && (
                <p
                    role={feedback.error ? 'alert' : 'status'}
                    className={`rounded-lg border p-4 text-sm ${feedback.error ? 'text-destructive' : 'text-primary'}`}
                >
                    {feedback.message}
                </p>
            )}
            {!loaded && (
                <p role="status" className="text-muted-foreground text-sm">
                    Opening downloads on this device...
                </p>
            )}
            {publicReader && unsupportedTranslation && !current && (
                <p className="text-muted-foreground rounded-lg border p-4 text-sm">
                    Your requested translation is unavailable offline. Choose a
                    downloaded WEB chapter below.
                </p>
            )}
            {publicReader && selected && !current && loaded && (
                <p className="text-muted-foreground rounded-lg border p-4 text-sm">
                    This chapter is not downloaded on this device. Choose an
                    available chapter below or reconnect to download it.
                </p>
            )}
            {publicReader && current && (
                <section className={card} aria-labelledby="offline-passage">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-primary text-xs font-medium tracking-wider uppercase">
                                WEB · Downloaded passage
                            </p>
                            <h2
                                id="offline-passage"
                                className="mt-1 text-2xl font-semibold"
                            >
                                {current.bookName} {current.chapter}
                            </h2>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Label htmlFor="offline-font">Text size</Label>
                            <select
                                id="offline-font"
                                className="bg-background rounded-md border p-2 text-sm"
                                value={fontSize}
                                onChange={(event) =>
                                    setFontSize(Number(event.target.value))
                                }
                            >
                                {[18, 20, 24, 28].map((size) => (
                                    <option key={size} value={size}>
                                        {size}px
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div
                        className="space-y-3 leading-relaxed"
                        style={{ fontSize }}
                    >
                        {current.verses.map((verse) => (
                            <p
                                key={verse.verse}
                                className="break-words whitespace-pre-wrap"
                            >
                                <sup className="text-muted-foreground mr-2 text-xs">
                                    {verse.verse}
                                </sup>
                                {verse.text}
                            </p>
                        ))}
                    </div>
                    <p className="text-muted-foreground text-xs">
                        World English Bible ·{' '}
                        <a href={current.licenseUrl} className="underline">
                            Public Domain
                        </a>{' '}
                        · Downloaded{' '}
                        {new Date(current.downloadedAt).toLocaleDateString()}
                    </p>
                    <div className="space-y-3 border-t pt-4">
                        <p className="text-muted-foreground text-sm">
                            {activeOwner
                                ? 'This log stays on the device until you sign in to the same account and sync. It does not update your journal or streak until confirmed.'
                                : 'Enable offline reading logs from Downloads while signed in to queue readings for your account.'}
                        </p>
                        <div className="max-w-xs space-y-2">
                            <Label htmlFor="offline-read-date">
                                Reading date
                            </Label>
                            <input
                                id="offline-read-date"
                                type="date"
                                className={input}
                                max={localToday()}
                                value={readOn}
                                onChange={(event) =>
                                    setReadOn(event.target.value)
                                }
                            />
                        </div>
                        <Button
                            disabled={busy || !activeOwner}
                            onClick={() => {
                                if (activeOwner)
                                    void act(async () => {
                                        await queueReading(
                                            activeOwner,
                                            current,
                                            readOn,
                                        );
                                        return 'Reading saved on this device. Pending sync to the account that enabled offline logs.';
                                    });
                            }}
                        >
                            <CloudUpload
                                className="size-4"
                                aria-hidden="true"
                            />
                            Queue reading log
                        </Button>
                    </div>
                </section>
            )}
            <section className={card}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <h2 className="flex items-center gap-2 text-lg font-semibold">
                        <Download
                            className="text-primary size-5"
                            aria-hidden="true"
                        />
                        Downloaded chapters
                    </h2>
                    <span className="text-muted-foreground text-xs">
                        {chapters.length}/{DOWNLOAD_LIMIT} chapters ·{' '}
                        {(totalBytes / 1024 / 1024).toFixed(2)}/
                        {DOWNLOAD_BYTES / 1024 / 1024} MB
                    </span>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                    These public WEB passages are available to anyone using this
                    browser. Account pages, journals, highlights and bookmarks
                    are kept online. Browser cleanup can remove downloads and
                    pending logs.
                </p>
                {chapters.length ? (
                    <ul className="divide-y">
                        {chapters.map((chapter) => (
                            <li
                                key={chapterKey(
                                    chapter.bookId,
                                    chapter.chapter,
                                )}
                                className="flex flex-wrap items-center justify-between gap-3 py-3"
                            >
                                <div className="min-w-0">
                                    <p className="font-medium">
                                        {chapter.bookName} {chapter.chapter}
                                    </p>
                                    <p className="text-muted-foreground text-xs">
                                        WEB · {chapter.verses.length} verses
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    {publicReader ? (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={busy}
                                            onClick={() => {
                                                setSelected(
                                                    chapterKey(
                                                        chapter.bookId,
                                                        chapter.chapter,
                                                    ),
                                                );
                                                window.scrollTo({
                                                    top: 0,
                                                    behavior: 'smooth',
                                                });
                                            }}
                                        >
                                            <BookOpen
                                                className="size-4"
                                                aria-hidden="true"
                                            />
                                            Read
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            asChild
                                        >
                                            <a
                                                href={`/offline?book=${chapter.bookId}&chapter=${chapter.chapter}`}
                                            >
                                                Read offline
                                            </a>
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        disabled={busy}
                                        aria-label={`Remove downloaded ${chapter.bookName} ${chapter.chapter}`}
                                        onClick={() =>
                                            void act(async () => {
                                                await removeChapter(
                                                    chapter.bookId,
                                                    chapter.chapter,
                                                );
                                                return 'Download removed. Pending logs are kept.';
                                            })
                                        }
                                    >
                                        <Trash2
                                            className="size-4"
                                            aria-hidden="true"
                                        />
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="bg-muted text-muted-foreground rounded-lg p-4 text-sm">
                        No chapters downloaded yet. While online, use Download
                        chapter in the WEB reader or on the Downloads page.
                    </p>
                )}
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        disabled={busy}
                        onClick={() =>
                            void act(async () => {
                                if (!navigator.storage?.persist)
                                    return 'This browser manages storage automatically. Keep backups of important information.';
                                return (await navigator.storage.persist())
                                    ? 'Persistent storage is enabled for this site. You can still clear it in browser settings.'
                                    : 'The browser did not grant persistent storage. Downloads may be removed during cleanup.';
                            })
                        }
                    >
                        Keep downloads on this device
                    </Button>
                    {chapters.length > 0 && (
                        <Button
                            variant="outline"
                            disabled={busy}
                            onClick={() => {
                                if (
                                    window.confirm(
                                        'Remove every downloaded chapter on this device? Pending reading logs are kept.',
                                    )
                                )
                                    void act(async () => {
                                        await clearChapters();
                                        return 'All chapter downloads removed. Pending logs are kept.';
                                    });
                            }}
                        >
                            Remove all downloads
                        </Button>
                    )}
                </div>
            </section>
            <section className={card}>
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                    <WifiOff
                        className="text-primary size-5"
                        aria-hidden="true"
                    />
                    Offline reading logs
                </h2>
                {ownerId ? (
                    <>
                        <label className="flex items-start gap-3 text-sm leading-relaxed">
                            <input
                                id="enable-offline-logs"
                                type="checkbox"
                                className="accent-primary mt-1 size-4 shrink-0"
                                checked={enabledOwner === ownerId}
                                disabled={busy || !loaded || Boolean(error)}
                                onChange={(event) => {
                                    const enabled = event.target.checked;
                                    void act(async () => {
                                        await setLoggingOwner(
                                            enabled ? ownerId : null,
                                        );
                                        return enabled
                                            ? 'Offline logs enabled for this account on this device.'
                                            : 'Offline logging disabled. Existing pending readings are kept for this account.';
                                    });
                                }}
                            />
                            <span>
                                Allow reading logs on this device while offline.
                                Only enable this on a trusted device. Sign out
                                or turn this off before leaving a shared
                                browser.
                            </span>
                        </label>
                        <p className="text-muted-foreground text-sm">
                            Up to 200 pending logs per device. Repeated logs for
                            the same chapter and date are queued once. Pending
                            logs sync when this account reconnects; rejected
                            logs stay here for review.
                        </p>
                        <div className="flex flex-wrap items-center gap-3">
                            <p className="text-sm font-medium">
                                {queue.length} pending for your account
                            </p>
                            <Button
                                variant="outline"
                                disabled={busy || queue.length === 0}
                                onClick={() =>
                                    void act(async () => {
                                        const result = await syncReadings(
                                            ownerId,
                                            true,
                                        );
                                        if (result.error)
                                            throw new Error(
                                                `${result.synced} synced. ${result.error} Remaining readings are kept on this device.`,
                                            );
                                        return `${result.synced} reading logs confirmed by your account.`;
                                    })
                                }
                            >
                                Sync pending readings
                            </Button>
                        </div>
                        {queue.length > 0 && (
                            <ul className="divide-y">
                                {queue.map((entry) => (
                                    <li
                                        key={entry.client_id}
                                        className="space-y-2 py-3"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <p className="text-sm font-medium">
                                                {entry.book_id} {entry.chapter}{' '}
                                                · {entry.read_on}
                                            </p>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                disabled={busy}
                                                onClick={() => {
                                                    if (
                                                        window.confirm(
                                                            'Discard this pending log? It will not be sent to your journal.',
                                                        )
                                                    )
                                                        void act(async () => {
                                                            await removePending(
                                                                ownerId,
                                                                entry.client_id,
                                                            );
                                                            return 'Pending log removed from this device.';
                                                        });
                                                }}
                                            >
                                                Discard pending log
                                            </Button>
                                        </div>
                                        {entry.error && (
                                            <p className="text-destructive text-sm break-words">
                                                {entry.error} Review the
                                                reading, discard it or retry
                                                after correcting your
                                                connection/date.
                                            </p>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </>
                ) : (
                    <>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            {enabledOwner
                                ? 'Logging is enabled for the last account that opted in on this device. Read a downloaded chapter to queue a log. Sign in to that same account to review or sync pending readings.'
                                : 'Offline logging is disabled. Sign in and enable it on the Downloads page before going offline.'}
                        </p>
                        {enabledOwner && (
                            <Button
                                variant="outline"
                                disabled={busy}
                                onClick={() =>
                                    void act(async () => {
                                        await setLoggingOwner(null);
                                        return 'Offline logging disabled. Pending readings are kept for their original account.';
                                    })
                                }
                            >
                                Disable offline logging
                            </Button>
                        )}
                        <Button variant="outline" asChild>
                            <a href="/downloads">Reconnect to account</a>
                        </Button>
                    </>
                )}
            </section>
            <section className="space-y-3 rounded-xl border p-5 text-sm">
                <h2 className="font-semibold">Reset this device</h2>
                <p className="text-muted-foreground">
                    Remove all downloaded chapters and pending logs, including
                    those from other accounts on this browser. Unsynced readings
                    will be lost. Confirmed journal entries stay in their
                    accounts.
                </p>
                <Button
                    variant="outline"
                    disabled={busy || !loaded}
                    onClick={() => {
                        if (
                            window.confirm(
                                'Permanently clear every offline chapter and pending log for all accounts on this device? Unsynced readings will be lost.',
                            )
                        )
                            void act(async () => {
                                await resetOfflineData();
                                return 'Offline data cleared on this device. Confirmed journal entries are unchanged.';
                            });
                    }}
                >
                    Reset offline data
                </Button>
            </section>
        </div>
    );
}
