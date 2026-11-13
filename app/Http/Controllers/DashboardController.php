<?php

namespace App\Http\Controllers;

use App\Services\BibleCatalog;
use App\Services\StreakService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(private StreakService $streaks) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $since = today()->subDays(371)->startOfWeek(Carbon::SUNDAY);

        $counts = $user->readingEntries()
            ->where('read_on', '>=', $since)
            ->whereDate('read_on', '<=', today())
            ->get(['read_on'])
            ->groupBy(fn ($entry) => $entry->read_on->format('Y-m-d'))
            ->map->count();

        return Inertia::render('dashboard', [
            'readingCounts' => $counts,
            'books' => BibleCatalog::books(),
            'today' => today()->toDateString(),
            'recentReadings' => $user->readingEntries()->latest('read_on')->latest('id')
                ->paginate(10)->through(fn ($entry): array => [
                    'id' => $entry->id,
                    'book' => $entry->book,
                    'chapter' => $entry->chapter,
                    'readOn' => $entry->read_on->toDateString(),
                    'translation' => $entry->translation ?? 'web',
                    'note' => $entry->note,
                ]),
            'currentStreak' => $this->streaks->current($user),
            'longestStreak' => $this->streaks->longest($user),
        ]);
    }
}
