import { Head, Link, useForm } from '@inertiajs/react';
import { Check, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
type Week = { start: string; end: string; chapters: number; days: number };
type Report = {
    uniqueChapters: number;
    totalChapters: number;
    percent: number;
    completedBooks: number;
    completedPlans: number;
    readingDays: number;
    loggedReadings: number;
    weeklyGoal: number;
    thisWeek: Week;
    weeks: Week[];
    books: {
        id: string;
        name: string;
        read: number;
        total: number;
        percent: number;
        complete: boolean;
        url: string;
    }[];
    milestones: {
        key: string;
        icon: string;
        earned: boolean;
        title: string;
        current: number;
        target: number;
        unit: string;
        achieved: boolean;
    }[];
};
const progressClass =
    'h-2 w-full overflow-hidden rounded-full [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-primary';
function WeeklyGoal({ report }: { report: Report }) {
    const { data, setData, patch, processing, errors, recentlySuccessful } =
        useForm({ weekly_chapter_goal: report.weeklyGoal });
    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                patch('/reports/goal', { preserveScroll: true });
            }}
            className="bg-card space-y-4 rounded-xl border p-5 shadow-sm sm:p-6"
        >
            <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Target className="text-primary size-5" aria-hidden="true" />
                Your weekly goal
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
                {report.thisWeek.chapters} unique chapters logged this week
                toward a goal of {report.weeklyGoal}. Weeks run Monday to
                Sunday.
            </p>
            <progress
                className={progressClass}
                value={Math.min(report.thisWeek.chapters, report.weeklyGoal)}
                max={report.weeklyGoal}
                aria-label="Current weekly reading goal progress"
            />
            <div className="space-y-2">
                <Label htmlFor="weekly-goal">Unique chapters per week</Label>
                <div className="flex flex-wrap gap-3">
                    <Input
                        id="weekly-goal"
                        className="max-w-36"
                        type="number"
                        required
                        min={1}
                        max={report.totalChapters}
                        value={data.weekly_chapter_goal || ''}
                        onChange={(event) =>
                            setData(
                                'weekly_chapter_goal',
                                Number(event.target.value),
                            )
                        }
                        aria-invalid={Boolean(errors.weekly_chapter_goal)}
                        aria-describedby={
                            errors.weekly_chapter_goal
                                ? 'weekly-goal-error'
                                : undefined
                        }
                    />
                    <Button disabled={processing}>
                        {processing ? 'Saving...' : 'Save goal'}
                    </Button>
                </div>
                <InputError
                    id="weekly-goal-error"
                    message={errors.weekly_chapter_goal}
                />
            </div>
            <p role="status" className="text-primary text-sm">
                {recentlySuccessful
                    ? 'Weekly goal saved.'
                    : report.thisWeek.chapters >= report.weeklyGoal
                      ? 'You reached your goal this week. Well done!'
                      : ''}
            </p>
        </form>
    );
}
export default function ReadingReports({ report }: { report: Report }) {
    const stats = [
        {
            label: 'Unique chapters',
            value: `${report.uniqueChapters} / ${report.totalChapters}`,
            detail: `${report.percent}% of the Bible`,
        },
        {
            label: 'Books completed',
            value: `${report.completedBooks} / ${report.books.length}`,
            detail: 'Every chapter in a book logged',
        },
        {
            label: 'Reading days',
            value: report.readingDays,
            detail: `${report.loggedReadings} reading logs`,
        },
        {
            label: 'Plans completed',
            value: report.completedPlans,
            detail: 'Guided and personal journeys',
        },
    ];
    return (
        <>
            <Head title="Reading progress" />
            <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
                <header className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-primary mb-1 text-sm font-medium">
                            See how far you have come
                        </p>
                        <h1 className="text-3xl font-semibold tracking-tight">
                            Your reading progress
                        </h1>
                        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
                            Unique progress counts each chapter once across
                            translations. Reports follow your saved reading
                            dates and update with your journal.
                        </p>
                    </div>
                    <Button asChild variant="outline">
                        <Link href="/reading-plans">Reading plans</Link>
                    </Button>
                </header>
                <section
                    aria-label="Reading totals"
                    className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
                >
                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            className="bg-card rounded-xl border p-5 shadow-sm"
                        >
                            <p className="text-muted-foreground text-sm">
                                {stat.label}
                            </p>
                            <p className="mt-3 text-2xl font-semibold tabular-nums">
                                {stat.value}
                            </p>
                            <p className="text-muted-foreground mt-1 text-xs">
                                {stat.detail}
                            </p>
                        </div>
                    ))}
                </section>
                <div className="grid items-start gap-6 lg:grid-cols-2">
                    <WeeklyGoal report={report} />
                    <section
                        className="bg-card rounded-xl border p-5 shadow-sm sm:p-6"
                        aria-labelledby="weekly-activity-heading"
                    >
                        <h2
                            id="weekly-activity-heading"
                            className="text-lg font-semibold"
                        >
                            Last eight weeks
                        </h2>
                        <p className="text-muted-foreground mt-1 text-xs">
                            Each week counts distinct chapters read in that
                            week. Bars compare with your current goal.
                        </p>
                        <ol className="mt-5 space-y-4">
                            {report.weeks.map((week) => (
                                <li key={week.start}>
                                    <div className="mb-1.5 flex flex-wrap justify-between gap-2 text-xs">
                                        <span>
                                            Week of{' '}
                                            <time dateTime={week.start}>
                                                {week.start}
                                            </time>
                                        </span>
                                        <span className="text-muted-foreground">
                                            {week.chapters} chapters ·{' '}
                                            {week.days} days
                                        </span>
                                    </div>
                                    <progress
                                        value={Math.min(
                                            week.chapters,
                                            report.weeklyGoal,
                                        )}
                                        max={report.weeklyGoal}
                                        className={progressClass}
                                        aria-label={`Week of ${week.start}: ${week.chapters} unique chapters`}
                                    />
                                </li>
                            ))}
                        </ol>
                    </section>
                </div>
                <section aria-labelledby="milestones-heading">
                    <h2
                        id="milestones-heading"
                        className="mb-4 text-xl font-semibold"
                    >
                        Your milestones
                    </h2>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {report.milestones.map((milestone) => (
                            <article
                                key={milestone.title}
                                className="bg-card space-y-3 rounded-xl border p-5"
                            >
                                <div className="flex items-start gap-3">
                                    <img
                                        src={milestone.icon}
                                        alt=""
                                        className={`size-20 shrink-0 object-contain ${milestone.earned ? '' : 'opacity-35 grayscale'}`}
                                    />
                                    <h3 className="font-medium">
                                        {milestone.title}
                                    </h3>
                                </div>
                                <p className="text-muted-foreground text-sm">
                                    {milestone.earned
                                        ? 'Badge earned'
                                        : `${Math.min(milestone.current, milestone.target)} of ${milestone.target} ${milestone.unit}`}
                                </p>
                                <progress
                                    value={Math.min(
                                        milestone.current,
                                        milestone.target,
                                    )}
                                    max={milestone.target}
                                    className={progressClass}
                                    aria-label={`${milestone.title} progress`}
                                />
                            </article>
                        ))}
                    </div>
                </section>
                <section aria-labelledby="book-progress-heading">
                    <h2
                        id="book-progress-heading"
                        className="mb-4 text-xl font-semibold"
                    >
                        Book by book
                    </h2>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {report.books.map((book) => (
                            <article
                                key={book.id}
                                className="bg-card space-y-3 rounded-xl border p-4"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <Link
                                        href={book.url}
                                        className="text-primary font-medium hover:underline"
                                    >
                                        {book.name}
                                    </Link>
                                    {book.complete && (
                                        <Check
                                            className="text-primary size-4 shrink-0"
                                            aria-label="Book complete"
                                        />
                                    )}
                                </div>
                                <p className="text-muted-foreground text-xs">
                                    {book.read} of {book.total} chapters ·{' '}
                                    {book.percent}%
                                </p>
                                <progress
                                    value={book.read}
                                    max={book.total}
                                    className={progressClass}
                                    aria-label={`${book.name} unique chapters read`}
                                />
                            </article>
                        ))}
                    </div>
                </section>
            </main>
        </>
    );
}
ReadingReports.layout = {
    breadcrumbs: [{ title: 'Reading progress', href: '/reports' }],
};
