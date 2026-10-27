<?php

namespace App\Http\Controllers;

use App\Models\ReadingPlan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReadingPlanController extends Controller
{
    public function index(Request $request): Response
    {
        $plans = ReadingPlan::query()
            ->orderBy('duration_days')
            ->get();

        $progressByPlan = $request->user()->readingPlanProgress()
            ->whereIn('reading_plan_id', $plans->modelKeys())
            ->get()
            ->keyBy('reading_plan_id');

        $plans = $plans
            ->map(function (ReadingPlan $plan) use ($progressByPlan, $request): array {
                $progress = $progressByPlan->get($plan->id);
                $todayReadings = [];

                if ($progress && $progress->current_day <= $plan->duration_days) {
                    $todayReadings = $plan->days()
                        ->where('day_number', $progress->current_day)
                        ->get(['book', 'chapters'])
                        ->flatMap(function ($reading): array {
                            preg_match_all('/\d+/', $reading->chapters, $matches);
                            $start = (int) ($matches[0][0] ?? 0);
                            $end = (int) ($matches[0][1] ?? $start);

                            return collect(range($start, $end))
                                ->map(fn (int $chapter): array => [
                                    'book' => $reading->book,
                                    'chapter' => $chapter,
                                    'reference' => $reading->book.' '.$chapter,
                                    'url' => route('bible.show', [
                                        'bookId' => $reading->book,
                                        'chapter' => $chapter,
                                    ]),
                                ])
                                ->all();
                        })
                        ->unique(fn (array $reading): string => $reading['book'].'-'.$reading['chapter'])
                        ->values()
                        ->all();

                    $readChapters = $request->user()->readingEntries()
                        ->whereDate('read_on', today())
                        ->get(['book', 'chapter'])
                        ->map(fn ($entry): string => $entry->book.'-'.$entry->chapter)
                        ->all();

                    $todayReadings = array_map(fn (array $reading): array => [
                        ...$reading,
                        'isRead' => in_array($reading['book'].'-'.$reading['chapter'], $readChapters, true),
                    ], $todayReadings);
                }

                return [
                    'id' => $plan->id,
                    'name' => $plan->name,
                    'slug' => $plan->slug,
                    'durationDays' => $plan->duration_days,
                    'currentDay' => $progress?->current_day,
                    'startedOn' => $progress?->started_on?->toDateString(),
                    'isComplete' => $progress?->current_day > $plan->duration_days,
                    'todayReadings' => $todayReadings,
                    'isTodayComplete' => $todayReadings !== [] && collect($todayReadings)->every(fn (array $reading): bool => $reading['isRead']),
                ];
            });

        return Inertia::render('reading-plans/index', [
            'plans' => $plans,
        ]);
    }

    public function store(Request $request, ReadingPlan $readingPlan): RedirectResponse
    {
        $request->user()->readingPlanProgress()->firstOrCreate(
            ['reading_plan_id' => $readingPlan->id],
            [
                'current_day' => 1,
                'started_on' => today(),
            ],
        );

        return to_route('reading-plans.index');
    }

    public function completeDay(Request $request, ReadingPlan $readingPlan): RedirectResponse
    {
        $progress = $request->user()->readingPlanProgress()
            ->where('reading_plan_id', $readingPlan->id)
            ->firstOrFail();

        if ($progress->current_day <= $readingPlan->duration_days) {
            $requiredReadings = $readingPlan->days()
                ->where('day_number', $progress->current_day)
                ->get(['book', 'chapters'])
                ->flatMap(function ($reading): array {
                    preg_match_all('/\d+/', $reading->chapters, $matches);
                    $start = (int) ($matches[0][0] ?? 0);
                    $end = (int) ($matches[0][1] ?? $start);

                    return collect(range($start, $end))
                        ->map(fn (int $chapter): array => ['book' => $reading->book, 'chapter' => $chapter])
                        ->all();
                })
                ->unique(fn (array $reading): string => $reading['book'].'-'.$reading['chapter'])
                ->values();

            $readKeys = $request->user()->readingEntries()
                ->whereDate('read_on', today())
                ->get(['book', 'chapter'])
                ->map(fn ($entry): string => $entry->book.'-'.$entry->chapter)
                ->all();

            $isComplete = $requiredReadings->isNotEmpty()
                && $requiredReadings->every(fn (array $reading): bool => in_array(
                    $reading['book'].'-'.$reading['chapter'],
                    $readKeys,
                    true,
                ));

            if (! $isComplete) {
                return to_route('reading-plans.index')->withErrors([
                    'readingPlan' => 'Read all of today’s assigned passages before continuing.',
                ]);
            }

            $progress->increment('current_day');
        }

        return to_route('reading-plans.index');
    }
}
