<?php

namespace App\Services;

use App\Models\User;
use Carbon\Carbon;

class StreakService
{
    /**
     * Current consecutive-day streak, ending today or yesterday.
     * (Yesterday still counts as "current" until the user misses today entirely —
     * otherwise the streak would flicker to 0 every morning before they've read.)
     */
    public function current(User $user): int
    {
        $readDates = $this->distinctReadDates($user);

        if ($readDates->isEmpty()) {
            return 0;
        }

        $today = Carbon::today();
        $mostRecent = $readDates->first();

        // Streak is broken if the last read day is older than yesterday.
        if ($mostRecent->lt($today->copy()->subDay())) {
            return 0;
        }

        $streak = 0;
        $cursor = $mostRecent->copy();

        foreach ($readDates as $date) {
            if ($date->eq($cursor)) {
                $streak++;
                $cursor->subDay();
            } else {
                break;
            }
        }

        return $streak;
    }

    /**
     * Longest streak ever achieved.
     */
    public function longest(User $user): int
    {
        $readDates = $this->distinctReadDates($user)->sort()->values();

        if ($readDates->isEmpty()) {
            return 0;
        }

        $longest = 1;
        $current = 1;

        for ($i = 1; $i < $readDates->count(); $i++) {
            if ($readDates[$i]->eq($readDates[$i - 1]->copy()->addDay())) {
                $current++;
                $longest = max($longest, $current);
            } else {
                $current = 1;
            }
        }

        return $longest;
    }

    /**
     * Distinct read_on dates, newest first, as Carbon instances.
     */
    private function distinctReadDates(User $user)
    {
        return $user->readingEntries()
            ->select('read_on')
            ->distinct()
            ->pluck('read_on')
            ->map(fn ($date) => Carbon::parse($date)->startOfDay())
            ->sortByDesc(fn ($date) => $date->timestamp)
            ->values();
    }
}