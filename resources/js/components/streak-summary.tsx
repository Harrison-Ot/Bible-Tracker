interface StreakSummaryProps {
    currentStreak: number;
    longestStreak: number;
}

export default function StreakSummary({ currentStreak, longestStreak }: StreakSummaryProps) {
    return (
        <div className="flex gap-4">
            <div className="flex-1 rounded-lg border border-[#D9E3D3] bg-white p-5">
                <p className="text-xs text-[#5B6B5D]">Current streak</p>
                <p className="mt-1 text-3xl font-medium text-[#153D1D]">
                    {currentStreak} <span className="text-base font-normal text-[#5B6B5D]">day{currentStreak === 1 ? '' : 's'}</span>
                </p>
            </div>
            <div className="flex-1 rounded-lg border border-[#D9E3D3] bg-white p-5">
                <p className="text-xs text-[#5B6B5D]">Longest streak</p>
                <p className="mt-1 text-3xl font-medium text-[#16241A]">
                    {longestStreak} <span className="text-base font-normal text-[#5B6B5D]">day{longestStreak === 1 ? '' : 's'}</span>
                </p>
            </div>
        </div>
    );
}