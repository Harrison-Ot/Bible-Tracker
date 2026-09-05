import { useMemo } from 'react';

interface ReadingHeatmapProps {
    readingCounts: Record<string, number>;
}

const SQUARE_TONE = [
    'bg-[#E4EBDF]', // 0 reads
    'bg-[#B7DDB0]', // 1
    'bg-[#8FCB8A]', // 2
    'bg-[#2F6B3C]', // 3
    'bg-[#153D1D]', // 4+
];

function toneFor(count: number): string {
    if (count <= 0) return SQUARE_TONE[0];
    if (count === 1) return SQUARE_TONE[1];
    if (count === 2) return SQUARE_TONE[2];
    if (count === 3) return SQUARE_TONE[3];
    return SQUARE_TONE[4];
}

function formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export default function ReadingHeatmap({ readingCounts }: ReadingHeatmapProps) {
    const { weeks, monthLabels } = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Start on the Sunday at/before 52 weeks ago, so the grid aligns like GitHub's.
        const start = new Date(today);
        start.setDate(start.getDate() - 371);
        start.setDate(start.getDate() - start.getDay());

        const days: { date: Date; count: number }[] = [];
        const cursor = new Date(start);
        while (cursor <= today) {
            const key = formatDateKey(cursor);
            days.push({ date: new Date(cursor), count: readingCounts[key] ?? 0 });
            cursor.setDate(cursor.getDate() + 1);
        }

        const weeks: { date: Date; count: number }[][] = [];
        for (let i = 0; i < days.length; i += 7) {
            weeks.push(days.slice(i, i + 7));
        }

        const monthLabels: { label: string; weekIndex: number }[] = [];
        let lastMonth = -1;
        weeks.forEach((week, i) => {
            const month = week[0].date.getMonth();
            if (month !== lastMonth) {
                monthLabels.push({
                    label: week[0].date.toLocaleString('default', { month: 'short' }),
                    weekIndex: i,
                });
                lastMonth = month;
            }
        });

        return { weeks, monthLabels };
    }, [readingCounts]);

    const totalReads = Object.values(readingCounts).reduce((sum, n) => sum + n, 0);

    return (
        <div className="w-full overflow-x-auto rounded-lg border border-[#D9E3D3] bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-[#16241A]">Your reading, this year</h3>
                <span className="text-xs text-[#5B6B5D]">{totalReads} chapters logged</span>
            </div>

            <div className="relative inline-block">
                <div className="mb-1 flex gap-[3px] pl-0 text-xs text-[#5B6B5D]">
                    {weeks.map((_, i) => {
                        const label = monthLabels.find((m) => m.weekIndex === i);
                        return (
                            <span key={i} className="w-3.5 shrink-0">
                                {label ? label.label : ''}
                            </span>
                        );
                    })}
                </div>

                <div className="flex gap-[3px]">
                    {weeks.map((week, wi) => (
                        <div key={wi} className="flex flex-col gap-[3px]">
                            {week.map((day, di) => (
                                <span
                                    key={di}
                                    title={`${formatDateKey(day.date)}: ${day.count} chapter${day.count === 1 ? '' : 's'}`}
                                    className={`h-3.5 w-3.5 rounded-[2px] ${toneFor(day.count)}`}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-1 text-xs text-[#5B6B5D]">
                <span>Less</span>
                {SQUARE_TONE.map((tone, i) => (
                    <span key={i} className={`h-2.5 w-2.5 rounded-[2px] ${tone}`} />
                ))}
                <span>More</span>
            </div>
        </div>
    );
}