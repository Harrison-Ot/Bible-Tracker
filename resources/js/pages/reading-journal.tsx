import { Head, Link, useForm } from '@inertiajs/react';
import { Search } from 'lucide-react';
import ReadingHistory, {
    type ReadingHistoryPage,
} from '@/components/reading-history';
import { type BibleBook } from '@/components/log-reading-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';

type Filters = { q?: string; book?: string; from?: string; to?: string };

function JournalFilters({
    filters,
    books,
}: {
    filters: Filters;
    books: BibleBook[];
}) {
    const { data, setData, get, processing, errors } = useForm({
        q: filters.q ?? '',
        book: filters.book ?? '',
        from: filters.from ?? '',
        to: filters.to ?? '',
    });
    return (
        <form
            aria-label="Filter reading journal"
            className="bg-card rounded-xl border p-5 shadow-sm sm:p-6"
            onSubmit={(event) => {
                event.preventDefault();
                get('/journal', { preserveState: false, preserveScroll: true });
            }}
        >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                    <Label htmlFor="journal-search">
                        Search reflections or passages
                    </Label>
                    <Input
                        id="journal-search"
                        type="search"
                        placeholder="e.g. hope or John 3"
                        maxLength={100}
                        value={data.q}
                        onChange={(event) => setData('q', event.target.value)}
                    />
                    <InputError message={errors.q} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="journal-book">Book</Label>
                    <select
                        id="journal-book"
                        value={data.book}
                        onChange={(event) =>
                            setData('book', event.target.value)
                        }
                        className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-2"
                    >
                        <option value="">All books</option>
                        {books.map((book) => (
                            <option key={book.id} value={book.name}>
                                {book.name}
                            </option>
                        ))}
                    </select>
                    <InputError message={errors.book} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="journal-from">From date</Label>
                    <Input
                        id="journal-from"
                        type="date"
                        value={data.from}
                        onChange={(event) =>
                            setData('from', event.target.value)
                        }
                    />
                    <InputError message={errors.from} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="journal-to">To date</Label>
                    <Input
                        id="journal-to"
                        type="date"
                        min={data.from || undefined}
                        value={data.to}
                        onChange={(event) => setData('to', event.target.value)}
                    />
                    <InputError message={errors.to} />
                </div>
            </div>
            <div className="mt-5 flex items-center gap-3">
                <Button disabled={processing}>
                    <Search aria-hidden="true" />
                    {processing ? 'Searching...' : 'Search journal'}
                </Button>
                <Button asChild variant="ghost">
                    <Link href="/journal">Clear filters</Link>
                </Button>
            </div>
        </form>
    );
}

export default function ReadingJournal({
    filters,
    books,
    readings,
}: {
    filters: Filters;
    books: BibleBook[];
    readings: ReadingHistoryPage;
}) {
    return (
        <>
            <Head title="Reading journal" />
            <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
                <header>
                    <p className="text-primary mb-1 text-sm font-medium">
                        Remember what spoke to you
                    </p>
                    <h1 className="text-3xl font-semibold tracking-tight">
                        Your reading journal
                    </h1>
                    <p className="text-muted-foreground mt-2 text-sm">
                        Revisit a passage, find a reflection, or add to your
                        thoughts.
                    </p>
                </header>
                <JournalFilters
                    key={JSON.stringify(filters)}
                    filters={filters}
                    books={books}
                />
                <ReadingHistory
                    readings={readings}
                    filtered={Object.values(filters).some(Boolean)}
                    showJournalLink={false}
                />
            </main>
        </>
    );
}

ReadingJournal.layout = {
    breadcrumbs: [{ title: 'Reading journal', href: '/journal' }],
};
