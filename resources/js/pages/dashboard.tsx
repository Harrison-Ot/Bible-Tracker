import { Head, usePage } from '@inertiajs/react';
import { dashboard } from '@/routes';
import ReadingHeatmap from '@/components/reading-heatmap';
import LogReadingForm from '@/components/log-reading-form';
import StreakSummary from '@/components/streak-summary';
import ProfileCard from '@/components/profile-card';

interface DashboardProps {
    readingCounts: Record<string, number>;
    currentStreak: number;
    longestStreak: number;
}

export default function Dashboard() {
    const { readingCounts, currentStreak, longestStreak } = usePage<{ props: DashboardProps }>().props as unknown as DashboardProps;

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <ProfileCard />
                </div>

                <div>
                    <ReadingHeatmap readingCounts={readingCounts} />
                </div>
                <div>
                    <StreakSummary currentStreak={currentStreak} longestStreak={longestStreak} />
                </div>
                <div>
                    <LogReadingForm />
                </div>
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