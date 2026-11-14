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

        $lastReading = $user->last_reading;
        if (! $lastReading) {
            $entry = $user->readingEntries()->whereDate('read_on', '<=', today())
                ->latest('read_on')->latest('id')->first();
            $book = $entry ? BibleCatalog::find($entry->book) : null;
            if ($book && $entry->chapter >= 1 && $entry->chapter <= $book['chapters']) {
                $lastReading = [
                    'bookId' => $book['id'],
                    'book' => $book['name'],
                    'chapter' => $entry->chapter,
                    'translation' => $entry->translation ?? 'web',
                ];
            }
        }

        $activePlans = $user->readingPlanProgress()->with('plan')->get()
            ->filter(fn ($progress) => $progress->plan && $progress->current_day <= $progress->plan->duration_days)
            ->map(fn ($progress): array => [
                'id' => $progress->reading_plan_id,
                'name' => $progress->plan->name,
                'currentDay' => $progress->current_day,
                'durationDays' => $progress->plan->duration_days,
            ])->values();

        return Inertia::render('dashboard', [
            'readingCounts' => $counts,
            'books' => BibleCatalog::books(),
            'today' => today()->toDateString(),
            'lastReading' => $lastReading,
            'activePlans' => $activePlans,
            'chaptersToday' => $user->readingEntries()->whereDate('read_on', today())
                ->get(['book', 'chapter'])->unique(fn ($entry) => $entry->book.'-'.$entry->chapter)->count(),
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
