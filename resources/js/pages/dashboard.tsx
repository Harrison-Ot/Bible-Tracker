import EarnedBadges, { type EarnedBadge } from '@/components/earned-badges';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    BookOpen,
    CalendarDays,
    Flame,
    Trophy,
} from 'lucide-react';
import { dashboard } from '@/routes';
import ReadingHeatmap from '@/components/reading-heatmap';
import LogReadingForm, { type BibleBook } from '@/components/log-reading-form';
import ReadingHistory, {
    type ReadingHistoryPage,
} from '@/components/reading-history';
import DailyVerse from '@/components/dailyverse';
import { Button } from '@/components/ui/button';
import type { Auth } from '@/types';

interface DashboardProps {
    earnedBadges?: EarnedBadge[];
    readingCounts: Record<string, number>;
    books: BibleBook[];
    today: string;
    recentReadings: ReadingHistoryPage;
    currentStreak: number;
    longestStreak: number;
    chaptersToday: number;
    lastReading: {
        bookId: string;
        book: string;
        chapter: number;
        translation: string;
    } | null;
    activePlans: {
        id: number;
        name: string;
        currentDay: number;
        durationDays: number;
        nextReadOn: string | null;
    }[];
}

export default function Dashboard({
    earnedBadges = [],
    readingCounts,
    currentStreak,
    longestStreak,
    books,
    today,
    recentReadings,
    chaptersToday,
    lastReading,
    activePlans,
}: DashboardProps) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const resumeUrl = lastReading
        ? `/bible/${lastReading.bookId}/${lastReading.chapter}?translation=${encodeURIComponent(lastReading.translation)}`
        : '/bible';
    const stats = [
        {
            label: 'Chapters today',
            value: chaptersToday,
            detail: 'Every chapter is a step forward',
            icon: BookOpen,
        },
        {
            label: 'Current streak',
            value: currentStreak,
            detail: `day${currentStreak === 1 ? '' : 's'} of showing up`,
            icon: Flame,
        },
        {
            label: 'Longest streak',
            value: longestStreak,
            detail: `day${longestStreak === 1 ? '' : 's'} in a row`,
            icon: Trophy,
        },
    ];

    return (
        <>
            <Head title="Dashboard" />
            <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 pb-28 sm:p-6 lg:gap-8 lg:p-8 lg:pb-28">
                <header className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <p className="text-primary mb-1 text-sm font-medium">
                            Your daily rhythm
                        </p>
                        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                            Welcome back, {auth.user.name.split(' ')[0]}.
                        </h1>
                        <p className="text-muted-foreground mt-2 text-sm">
                            Make a little room for the Word today.
                        </p>
                    </div>
                    <time
                        dateTime={today}
                        className="text-muted-foreground flex items-center gap-2 text-sm"
                    >
                        <CalendarDays className="size-4" aria-hidden="true" />
                        {new Date(`${today}T00:00:00`).toLocaleDateString(
                            undefined,
                            {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                            },
                        )}
                    </time>
                </header>

                <section
                    aria-labelledby="continue-heading"
                    className="bg-primary text-primary-foreground relative overflow-hidden rounded-2xl p-6 sm:p-8"
                >
                    <BookOpen
                        className="pointer-events-none absolute -right-5 -bottom-6 size-48 -rotate-12 opacity-[0.07]"
                        aria-hidden="true"
                    />
                    <div className="relative flex flex-wrap items-center justify-between gap-6">
                        <div className="max-w-xl space-y-3">
                            <p className="text-xs font-semibold tracking-widest uppercase opacity-75">
                                {lastReading
                                    ? 'Pick up where you left off'
                                    : 'A fresh start'}
                            </p>
                            <h2
                                id="continue-heading"
                                className="text-2xl font-semibold tracking-tight sm:text-3xl"
                            >
                                {lastReading
                                    ? `${lastReading.book} ${lastReading.chapter}`
                                    : 'One chapter. A little reflection.'}
                            </h2>
                            <p className="text-sm leading-relaxed opacity-80">
                                {lastReading
                                    ? `${lastReading.translation.toUpperCase()} · Your last opened chapter is ready for you.`
                                    : 'Find a passage, take your time, and keep what speaks to you.'}
                            </p>
                        </div>
                        <Button
                            asChild
                            size="lg"
                            className="bg-background text-foreground hover:bg-background/90"
                        >
                            <Link href={resumeUrl}>
                                {lastReading
                                    ? 'Continue reading'
                                    : 'Open the Bible'}
                                <ArrowRight aria-hidden="true" />
                            </Link>
                        </Button>
                    </div>
                </section>

                <section
                    aria-label="Reading statistics"
                    className="grid gap-3 sm:grid-cols-3 sm:gap-4"
                >
                    {stats.map(({ label, value, detail, icon: Icon }) => (
                        <div
                            key={label}
                            className="bg-card rounded-xl border p-5 shadow-sm"
                        >
                            <div className="text-muted-foreground flex items-center justify-between text-sm">
                                <span>{label}</span>
                                <Icon
                                    className="text-primary size-4"
                                    aria-hidden="true"
                                />
                            </div>
                            <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">
                                {value}
                            </p>
                            <p className="text-muted-foreground mt-1 text-xs">
                                {detail}
                            </p>
                        </div>
                    ))}
                </section>

                <div className="grid items-stretch gap-6 lg:grid-cols-2">
                    <section
                        aria-labelledby="plans-heading"
                        className="bg-card rounded-xl border p-6 shadow-sm"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h2
                                id="plans-heading"
                                className="text-lg font-semibold"
                            >
                                Your reading plans
                            </h2>
                            <Link
                                href="/reading-plans"
                                className="text-primary text-sm font-medium hover:underline"
                            >
                                View plans
                            </Link>
                        </div>
                        {activePlans.length ? (
                            <ul className="mt-5 space-y-4">
                                {activePlans.map((plan) => (
                                    <li key={plan.id}>
                                        <Link
                                            href="/reading-plans"
                                            className="hover:bg-accent block rounded-lg border p-4 transition-colors"
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="font-medium">
                                                    {plan.name}
                                                </span>
                                                <ArrowRight
                                                    className="text-primary size-4 shrink-0"
                                                    aria-hidden="true"
                                                />
                                            </div>
                                            <p className="text-muted-foreground mt-1 text-xs">
                                                Reading {plan.currentDay} of{' '}
                                                {plan.durationDays} · Open next
                                                passages
                                            </p>
                                            <progress
                                                aria-label={`${plan.name} completed days`}
                                                value={plan.currentDay - 1}
                                                max={plan.durationDays}
                                                className="[&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-primary mt-3 h-1.5 w-full overflow-hidden rounded-full"
                                            />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="bg-muted/60 mt-5 rounded-lg p-5">
                                <BookOpen
                                    className="text-primary mb-3 size-6"
                                    aria-hidden="true"
                                />
                                <p className="font-medium">
                                    Find a pace that fits your life.
                                </p>
                                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                                    Choose a guided journey through the Gospels,
                                    wisdom books, or the whole Bible.
                                </p>
                                <Button
                                    asChild
                                    variant="outline"
                                    className="mt-4"
                                >
                                    <Link href="/reading-plans">
                                        Choose a plan
                                        <ArrowRight aria-hidden="true" />
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </section>
                    <DailyVerse today={today} />
                </div>

                <LogReadingForm books={books} />
                <section aria-label="Reading activity" className="min-w-0">
                    <ReadingHeatmap
                        readingCounts={readingCounts}
                        todayKey={today}
                    />
                </section>
                <ReadingHistory readings={recentReadings} />
            </main>
            <EarnedBadges badges={earnedBadges} />
        </>
    );
}

Dashboard.layout = { breadcrumbs: [{ title: 'Dashboard', href: dashboard() }] };
