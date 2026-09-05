<?php

namespace App\Http\Controllers;

use App\Services\StreakService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(private StreakService $streaks)
    {
    }

    public function index(Request $request): Response
    {
        $user = $request->user();
        $since = now()->subDays(370)->startOfDay();

        $counts = $user->readingEntries()
            ->where('read_on', '>=', $since)
            ->get()
            ->groupBy(fn ($entry) => $entry->read_on->format('Y-m-d'))
            ->map->count();

        return Inertia::render('dashboard', [
            'readingCounts' => $counts,
            'currentStreak' => $this->streaks->current($user),
            'longestStreak' => $this->streaks->longest($user),
        ]);
    }
}