import { Head, Link, router, useForm } from '@inertiajs/react';
import { Bookmark, Highlighter, Search, Trash2 } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { type BibleBook } from '@/components/log-reading-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import ActionFeedback from '@/components/action-feedback';
import ImportDeviceHighlights from '@/components/import-device-highlights';
import { savedVerseRequest, type SavedVerse } from '@/lib/saved-verses';

type Filters = {
    q?: string;
    book?: string;
    kind?: string;
    translation?: string;
};
type VersePage = {
    data: SavedVerse[];
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};
const selectClass =
    'h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring';

function SavedVerseFilters({
    filters,
    books,
    translations,
}: {
    filters: Filters;
    books: BibleBook[];
    translations: string[];
}) {
    const { data, setData, get, processing, errors } = useForm({
        q: filters.q ?? '',
        book: filters.book ?? '',
        kind: filters.kind ?? '',
        translation: filters.translation ?? '',
    });
    return (
        <form
            aria-label="Filter saved verses"
            className="bg-card rounded-xl border p-5 shadow-sm sm:p-6"
            onSubmit={(event) => {
                event.preventDefault();
                get('/saved-verses', {
                    preserveState: false,
                    preserveScroll: true,
                });
            }}
        >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                    <Label htmlFor="saved-search">Search text or passage</Label>
                    <Input
                        id="saved-search"
                        type="search"
                        maxLength={100}
                        placeholder="e.g. grace or John 3:16"
                        value={data.q}
                        onChange={(event) => setData('q', event.target.value)}
                        className="h-10"
                    />
                    <InputError message={errors.q} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="saved-book">Book</Label>
                    <select
                        id="saved-book"
                        className={selectClass}
                        value={data.book}
                        onChange={(event) =>
                            setData('book', event.target.value)
                        }
                    >
                        <option value="">All books</option>
                        {books.map((book) => (
                            <option key={book.id} value={book.id}>
                                {book.name}
                            </option>
                        ))}
                    </select>
                    <InputError message={errors.book} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="saved-kind">Saved as</Label>
                    <select
                        id="saved-kind"
                        className={selectClass}
                        value={data.kind}
                        onChange={(event) =>
                            setData('kind', event.target.value)
                        }
                    >
                        <option value="">All saved verses</option>
                        <option value="highlighted">Highlights</option>
                        <option value="bookmarked">Bookmarks</option>
                    </select>
                    <InputError message={errors.kind} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="saved-translation">Translation</Label>
                    <select
                        id="saved-translation"
                        className={selectClass}
                        value={data.translation}
                        onChange={(event) =>
                            setData('translation', event.target.value)
                        }
                    >
                        <option value="">All translations</option>
                        {translations.map((translation) => (
                            <option key={translation} value={translation}>
                                {translation.toUpperCase()}
                            </option>
                        ))}
                    </select>
                    <InputError message={errors.translation} />
                </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
                <Button disabled={processing}>
                    <Search aria-hidden="true" />
                    {processing ? 'Searching...' : 'Search saved verses'}
                </Button>
                <Button asChild variant="ghost">
                    <Link href="/saved-verses">Clear filters</Link>
                </Button>
            </div>
        </form>
    );
}

export default function SavedVerses({
    filters,
    books,
    translations,
    verses,
}: {
    filters: Filters;
    books: BibleBook[];
    translations: string[];
    verses: VersePage;
}) {
    const [pending, setPending] = useState<number | null>(null);
    const [importing, setImporting] = useState(false);
    const [feedback, setFeedback] = useState<{
        error: boolean;
        message: string;
    } | null>(null);
    const locked = useRef(false);
    const allowedBookIds = useMemo(() => books.map((book) => book.id), [books]);
    const reload = () => router.reload({ only: ['verses', 'translations'] });
    const remove = async (entry: SavedVerse) => {
        if (
            locked.current ||
            importing ||
            !window.confirm(
                `Remove ${entry.book} ${entry.chapter}:${entry.verse} (${entry.translation.toUpperCase()}) from saved verses? This removes its highlight and bookmark.`,
            )
        )
            return;
        locked.current = true;
        setPending(entry.id);
        setFeedback(null);
        try {
            await savedVerseRequest(`/saved-verses/${entry.id}`, 'DELETE');
            setFeedback({
                error: false,
                message: 'Verse removed from your saved collection.',
            });
            reload();
        } catch (error) {
            setFeedback({
                error: true,
                message:
                    error instanceof Error
                        ? error.message
                        : 'Could not remove this verse.',
            });
        } finally {
            locked.current = false;
            setPending(null);
        }
    };
    const filtered = Object.values(filters).some(Boolean);
    return (
        <>
            <Head title="Saved verses" />
            <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
                <header>
                    <p className="text-primary mb-1 text-sm font-medium">
                        Words to return to
                    </p>
                    <h1 className="text-3xl font-semibold tracking-tight">
                        Your saved verses
                    </h1>
                    <p className="text-muted-foreground mt-2 max-w-prose text-sm leading-relaxed">
                        Keep highlights and bookmarks together, ready on any
                        device when you sign in.
                    </p>
                </header>
                <ImportDeviceHighlights
                    allowedBookIds={allowedBookIds}
                    disabled={pending !== null}
                    onBusy={setImporting}
                    onComplete={reload}
                />
                <SavedVerseFilters
                    key={JSON.stringify(filters)}
                    filters={filters}
                    books={books}
                    translations={translations}
                />
                <ActionFeedback feedback={feedback} />
                <section
                    aria-labelledby="saved-results-heading"
                    className="bg-card rounded-xl border p-5 shadow-sm sm:p-6"
                >
                    <h2 id="saved-results-heading" className="font-semibold">
                        {verses.total} {filtered ? 'matching ' : ''}saved{' '}
                        {verses.total === 1 ? 'verse' : 'verses'}
                    </h2>
                    {verses.data.length ? (
                        <ul className="mt-2 divide-y">
                            {verses.data.map((entry) => (
                                <li key={entry.id} className="space-y-3 py-5">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <Link
                                                href={entry.url}
                                                className="text-primary font-semibold hover:underline"
                                            >
                                                {entry.book} {entry.chapter}:
                                                {entry.verse}
                                            </Link>
                                            <p className="text-muted-foreground mt-1 text-xs">
                                                {entry.translation.toUpperCase()}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            {entry.highlighted && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-950 dark:bg-amber-900/40 dark:text-amber-100">
                                                    <Highlighter
                                                        className="size-3"
                                                        aria-hidden="true"
                                                    />
                                                    Highlight
                                                </span>
                                            )}
                                            {entry.bookmarked && (
                                                <span className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs">
                                                    <Bookmark
                                                        className="size-3"
                                                        aria-hidden="true"
                                                    />
                                                    Bookmark
                                                </span>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                disabled={
                                                    pending !== null ||
                                                    importing
                                                }
                                                aria-label={`Remove ${entry.book} ${entry.chapter}:${entry.verse} (${entry.translation.toUpperCase()}) from saved verses`}
                                                className="text-red-700 dark:text-red-400"
                                                onClick={() => remove(entry)}
                                            >
                                                <Trash2 aria-hidden="true" />
                                                {pending === entry.id
                                                    ? 'Removing...'
                                                    : 'Remove'}
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="max-w-prose text-base leading-relaxed break-words whitespace-pre-wrap">
                                        {entry.text}
                                    </p>
                                    <Link
                                        href={entry.url}
                                        className="text-primary inline-block text-sm font-medium hover:underline"
                                    >
                                        Open passage
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="py-10 text-center">
                            <Bookmark
                                className="text-muted-foreground mx-auto mb-3 size-8"
                                aria-hidden="true"
                            />
                            <p className="font-medium">
                                {filtered
                                    ? 'No saved verses match these filters.'
                                    : 'Keep a verse close.'}
                            </p>
                            <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm leading-relaxed">
                                {filtered
                                    ? 'Try another search or clear your filters.'
                                    : 'Highlight a verse or use its bookmark button while reading. It will appear here.'}
                            </p>
                            {!filtered && (
                                <Button
                                    asChild
                                    variant="outline"
                                    className="mt-4"
                                >
                                    <Link href="/bible">Browse the Bible</Link>
                                </Button>
                            )}
                        </div>
                    )}
                    {(verses.prev_page_url || verses.next_page_url) && (
                        <nav
                            aria-label="Saved verse pages"
                            className="text-primary mt-4 flex flex-wrap justify-between gap-3 border-t pt-4 text-sm"
                        >
                            {verses.prev_page_url ? (
                                <Link
                                    href={verses.prev_page_url}
                                    preserveScroll
                                >
                                    Previous page
                                </Link>
                            ) : (
                                <span />
                            )}
                            {verses.next_page_url && (
                                <Link
                                    href={verses.next_page_url}
                                    preserveScroll
                                >
                                    Next page
                                </Link>
                            )}
                        </nav>
                    )}
                </section>
            </main>
        </>
    );
}
SavedVerses.layout = {
    breadcrumbs: [{ title: 'Saved verses', href: '/saved-verses' }],
};
