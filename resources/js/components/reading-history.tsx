import { Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { BookOpen, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';

export interface ReadingHistoryPage {
    data: {
        id: number;
        book: string;
        chapter: number;
        readOn: string;
        translation: string;
        note: string | null;
    }[];
    prev_page_url: string | null;
    next_page_url: string | null;
    total: number;
}

function JournalEntry({
    entry,
}: {
    entry: ReadingHistoryPage['data'][number];
}) {
    const [editing, setEditing] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const { data, setData, patch, processing, errors, clearErrors } = useForm({
        note: entry.note ?? '',
    });
    const remove = () => {
        if (!window.confirm('Remove this reading and its note?')) return;
        router.delete(`/reading-entries/${entry.id}`, {
            preserveScroll: true,
            onStart: () => setDeleting(true),
            onFinish: () => setDeleting(false),
        });
    };

    return (
        <li className="py-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <Link
                        href={`/bible/${encodeURIComponent(entry.book)}/${entry.chapter}?translation=${encodeURIComponent(entry.translation)}`}
                        className="text-primary font-semibold hover:underline"
                    >
                        {entry.book} {entry.chapter}
                    </Link>
                    <p className="text-muted-foreground mt-1 text-xs">
                        <time dateTime={entry.readOn}>{entry.readOn}</time> ·{' '}
                        {entry.translation.toUpperCase()}
                    </p>
                </div>
                <div className="flex gap-1">
                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={editing || deleting}
                        aria-label={`Edit reflection for ${entry.book} ${entry.chapter} from ${entry.readOn}`}
                        onClick={() => {
                            setData('note', entry.note ?? '');
                            clearErrors();
                            setEditing(true);
                        }}
                    >
                        <Pencil aria-hidden="true" />
                        Edit
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={processing || deleting}
                        onClick={remove}
                        aria-label={`Remove ${entry.book} ${entry.chapter} from ${entry.readOn}`}
                        className="text-destructive hover:text-destructive dark:text-red-400 dark:hover:text-red-300"
                    >
                        <Trash2 aria-hidden="true" />
                        {deleting ? 'Removing...' : 'Remove'}
                    </Button>
                </div>
            </div>
            {editing ? (
                <form
                    className="mt-4 space-y-3"
                    onSubmit={(event) => {
                        event.preventDefault();
                        patch(`/reading-entries/${entry.id}`, {
                            preserveScroll: true,
                            onSuccess: () => setEditing(false),
                        });
                    }}
                >
                    <Label htmlFor={`note-${entry.id}`}>Your reflection</Label>
                    <textarea
                        id={`note-${entry.id}`}
                        autoFocus
                        rows={4}
                        maxLength={1000}
                        value={data.note}
                        onChange={(event) =>
                            setData('note', event.target.value)
                        }
                        aria-invalid={Boolean(errors.note)}
                        aria-describedby={
                            errors.note ? `note-error-${entry.id}` : undefined
                        }
                        className="border-input bg-background focus-visible:ring-ring w-full rounded-lg border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                    />
                    <div id={`note-error-${entry.id}`} role="alert">
                        <InputError message={errors.note} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button size="sm" disabled={processing}>
                            {processing ? 'Saving...' : 'Save reflection'}
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={processing}
                            onClick={() => setEditing(false)}
                        >
                            Cancel
                        </Button>
                        <span className="text-muted-foreground ml-auto text-xs">
                            {data.note.length}/1000
                        </span>
                    </div>
                </form>
            ) : entry.note ? (
                <p className="mt-3 max-w-prose text-sm leading-relaxed break-words whitespace-pre-wrap">
                    {entry.note}
                </p>
            ) : (
                <p className="text-muted-foreground mt-3 text-sm">
                    No reflection yet. Add a thought with Edit.
                </p>
            )}
        </li>
    );
}

export default function ReadingHistory({
    readings,
    filtered = false,
    showJournalLink = true,
}: {
    readings: ReadingHistoryPage;
    filtered?: boolean;
    showJournalLink?: boolean;
}) {
    return (
        <section
            aria-labelledby="history-heading"
            className="bg-card text-card-foreground rounded-xl border p-5 shadow-sm sm:p-6"
        >
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 id="history-heading" className="text-lg font-semibold">
                        Reading journal
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                        {readings.total} {filtered ? 'matching ' : ''}
                        {readings.total === 1 ? 'entry' : 'entries'}
                    </p>
                </div>
                {showJournalLink && (
                    <Button asChild variant="outline" size="sm">
                        <Link href="/journal">Search journal</Link>
                    </Button>
                )}
            </div>
            {readings.data.length === 0 ? (
                <div className="py-10 text-center">
                    <BookOpen
                        className="text-muted-foreground mx-auto mb-3 size-8"
                        aria-hidden="true"
                    />
                    <p className="font-medium">
                        {filtered
                            ? 'No entries match these filters.'
                            : 'Your reflections start here.'}
                    </p>
                    <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm leading-relaxed">
                        {filtered
                            ? 'Try another search or clear your filters to see all your readings.'
                            : 'Read a chapter and log a thought. You can return to it whenever you need.'}
                    </p>
                    {!filtered && (
                        <Button asChild variant="outline" className="mt-4">
                            <Link href="/bible">Find a passage</Link>
                        </Button>
                    )}
                </div>
            ) : (
                <ul className="mt-2 divide-y">
                    {readings.data.map((entry) => (
                        <JournalEntry key={entry.id} entry={entry} />
                    ))}
                </ul>
            )}
            {(readings.prev_page_url || readings.next_page_url) && (
                <nav
                    aria-label="Reading journal pages"
                    className="text-primary mt-4 flex flex-wrap justify-between gap-3 border-t pt-4 text-sm"
                >
                    {readings.prev_page_url ? (
                        <Link
                            href={readings.prev_page_url}
                            preserveScroll
                            className="hover:underline"
                        >
                            Newer entries
                        </Link>
                    ) : (
                        <span />
                    )}
                    {readings.next_page_url && (
                        <Link
                            href={readings.next_page_url}
                            preserveScroll
                            className="hover:underline"
                        >
                            Older entries
                        </Link>
                    )}
                </nav>
            )}
        </section>
    );
}
