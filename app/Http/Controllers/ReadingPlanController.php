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
            ->map(function (ReadingPlan $plan) use ($progressByPlan): array {
                $progress = $progressByPlan->get($plan->id);

                return [
                    'id' => $plan->id,
                    'name' => $plan->name,
                    'slug' => $plan->slug,
                    'durationDays' => $plan->duration_days,
                    'currentDay' => $progress?->current_day,
                    'startedOn' => $progress?->started_on?->toDateString(),
                    'isComplete' => $progress?->current_day > $plan->duration_days,
                    'todayReadings' => $progress && $progress->current_day <= $plan->duration_days
                        ? $plan->days()
                            ->where('day_number', $progress->current_day)
                            ->get(['book', 'chapters'])
                            ->map(fn ($reading): array => [
                                'book' => $reading->book,
                                'chapters' => $reading->chapters,
                            ])
                            ->all()
                        : [],
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
            $progress->increment('current_day');
        }

        return to_route('reading-plans.index');
    }
}
