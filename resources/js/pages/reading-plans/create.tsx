import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { type BibleBook } from '@/components/log-reading-form';
import ReadingDays from '@/components/reading-days';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
export default function CreateReadingPlan({
    books,
    today,
    creationToken,
}: {
    books: BibleBook[];
    today: string;
    creationToken: string;
}) {
    const { data, setData, post, processing, errors } = useForm({
        creation_token: creationToken,
        name: 'My reading rhythm',
        start_book: 'GEN',
        end_book: 'REV',
        chapters_per_reading: 3,
        reading_days: [0, 1, 2, 3, 4, 5, 6],
        next_read_on: today,
    });
    const start = books.findIndex((book) => book.id === data.start_book);
    const end = books.findIndex((book) => book.id === data.end_book);
    const chapters =
        end >= start
            ? books
                  .slice(start, end + 1)
                  .reduce((total, book) => total + book.chapters, 0)
            : 0;
    const count =
        data.chapters_per_reading > 0
            ? Math.ceil(chapters / data.chapters_per_reading)
            : 0;
    const dayError = Object.entries(errors)
        .filter(([field]) => field.startsWith('reading_days'))
        .map(([, value]) => value)
        .join(' ');
    const selectClass =
        'h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring';
    return (
        <>
            <Head title="Create a reading plan" />
            <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
                <Link
                    href="/reading-plans"
                    className="text-primary inline-flex items-center gap-2 text-sm font-medium hover:underline"
                >
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    Reading plans
                </Link>
                <header>
                    <p className="text-primary mb-1 text-sm font-medium">
                        A pace of your own
                    </p>
                    <h1 className="text-3xl font-semibold tracking-tight">
                        Create your reading plan
                    </h1>
                    <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                        Choose a book range and a rhythm that fits your week.
                        Your plan is private to your account.
                    </p>
                </header>
                <form
                    className="bg-card space-y-5 rounded-xl border p-5 shadow-sm sm:p-6"
                    onSubmit={(event) => {
                        event.preventDefault();
                        post('/reading-plans');
                    }}
                >
                    <div className="space-y-2">
                        <Label htmlFor="plan-name">Plan name</Label>
                        <Input
                            id="plan-name"
                            maxLength={80}
                            required
                            value={data.name}
                            onChange={(event) =>
                                setData('name', event.target.value)
                            }
                            aria-invalid={Boolean(errors.name)}
                        />
                        <InputError message={errors.name} />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="plan-first-book">From book</Label>
                            <select
                                id="plan-first-book"
                                value={data.start_book}
                                className={selectClass}
                                onChange={(event) =>
                                    setData('start_book', event.target.value)
                                }
                            >
                                {books.map((book) => (
                                    <option key={book.id} value={book.id}>
                                        {book.name}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.start_book} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="plan-last-book">Through book</Label>
                            <select
                                id="plan-last-book"
                                value={data.end_book}
                                className={selectClass}
                                onChange={(event) =>
                                    setData('end_book', event.target.value)
                                }
                            >
                                {books.map((book) => (
                                    <option key={book.id} value={book.id}>
                                        {book.name}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.end_book} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="plan-pace">
                                Chapters per reading
                            </Label>
                            <Input
                                id="plan-pace"
                                type="number"
                                min={1}
                                max={20}
                                required
                                value={data.chapters_per_reading || ''}
                                onChange={(event) =>
                                    setData(
                                        'chapters_per_reading',
                                        Number(event.target.value),
                                    )
                                }
                            />
                            <InputError message={errors.chapters_per_reading} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="plan-start">Schedule from</Label>
                            <Input
                                id="plan-start"
                                type="date"
                                min={today}
                                required
                                value={data.next_read_on}
                                onChange={(event) =>
                                    setData('next_read_on', event.target.value)
                                }
                            />
                            <InputError message={errors.next_read_on} />
                        </div>
                    </div>
                    <ReadingDays
                        id="custom-days"
                        value={data.reading_days}
                        disabled={processing}
                        error={dayError}
                        onChange={(day, checked) =>
                            setData((previous) => ({
                                ...previous,
                                reading_days: checked
                                    ? [...previous.reading_days, day].sort(
                                          (a, b) => a - b,
                                      )
                                    : previous.reading_days.filter(
                                          (value) => value !== day,
                                      ),
                            }))
                        }
                    />
                    <div className="bg-primary/5 rounded-lg p-4 text-sm">
                        <p className="flex items-center gap-2 font-medium">
                            <BookOpen
                                className="text-primary size-4"
                                aria-hidden="true"
                            />
                            {chapters
                                ? `${chapters} chapters across ${count} readings`
                                : 'Choose a book range in Bible order.'}
                        </p>
                        <p className="text-muted-foreground mt-2 leading-relaxed">
                            The first reading falls on a selected weekday on or
                            after your date. You can read ahead, pause, or
                            adjust the remaining schedule later.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Button
                            disabled={
                                processing ||
                                !count ||
                                !data.reading_days.length
                            }
                        >
                            {processing
                                ? 'Creating...'
                                : 'Create and start plan'}
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/reading-plans">Cancel</Link>
                        </Button>
                    </div>
                </form>
            </main>
        </>
    );
}
CreateReadingPlan.layout = {
    breadcrumbs: [
        { title: 'Reading plans', href: '/reading-plans' },
        { title: 'Create plan', href: '/reading-plans/create' },
    ],
};
