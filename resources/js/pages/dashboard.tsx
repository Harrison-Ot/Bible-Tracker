import { Head, Link } from '@inertiajs/react';
import { dashboard } from '@/routes';
import ReadingHeatmap from '@/components/reading-heatmap';
import LogReadingForm, { type BibleBook } from '@/components/log-reading-form';
import ReadingHistory, {
    type ReadingHistoryPage,
} from '@/components/reading-history';
import StreakSummary from '@/components/streak-summary';
import ProfileCard from '@/components/profile-card';
import DailyVerse from '@/components/dailyverse';

interface DashboardProps {
    readingCounts: Record<string, number>;
    books: BibleBook[];
    today: string;
    recentReadings: ReadingHistoryPage;
    currentStreak: number;
    longestStreak: number;
}

export default function Dashboard({
    readingCounts,
    currentStreak,
    longestStreak,
    books,
    today,
    recentReadings,
}: DashboardProps) {
    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-[#E4EBDF] p-6 text-[#16241A]">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            A little time in the Word, every day.
                        </h1>
                        <p className="mt-1 text-sm text-[#5B6B5D]">
                            Read, reflect, and build a lasting habit.
                        </p>
                    </div>
                    <Link
                        href="/bible"
                        className="rounded-full bg-[#2F6B3C] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#153D1D]"
                    >
                        Open the Bible
                    </Link>
                </div>
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <ProfileCard />
                    <DailyVerse today={today} />
                </div>

                <div>
                    <ReadingHeatmap
                        readingCounts={readingCounts}
                        todayKey={today}
                    />
                </div>
                <div>
                    <StreakSummary
                        currentStreak={currentStreak}
                        longestStreak={longestStreak}
                    />
                </div>
                <div>
                    <LogReadingForm books={books} />
                </div>
                <ReadingHistory readings={recentReadings} />
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
