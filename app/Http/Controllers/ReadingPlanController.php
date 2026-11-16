<?php

namespace App\Http\Controllers;

use App\Models\ReadingPlan;
use App\Services\BibleCatalog;
use App\Services\ReadingPlanService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ReadingPlanController extends Controller
{
    public function __construct(private ReadingPlanService $plans) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $progress = $user->readingPlanProgress()->get()->keyBy('reading_plan_id');
        $plans = ReadingPlan::query()->where(fn ($query) => $query->whereNull('user_id')->orWhere('user_id', $user->id))
            ->orderBy('duration_days')->orderBy('id')->get()
            ->map(fn ($plan): array => $this->plans->forClient($plan, $progress->get($plan->id), $user));

        return Inertia::render('reading-plans/index', ['plans' => $plans, 'today' => today()->toDateString()]);
    }

    public function create(): Response
    {
        return Inertia::render('reading-plans/create', ['books' => BibleCatalog::books(), 'today' => today()->toDateString(), 'creationToken' => (string) Str::uuid()]);
    }

    public function storeCustom(Request $request): RedirectResponse
    {
        $books = BibleCatalog::books();
        $data = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'creation_token' => ['required', 'uuid'],
            'start_book' => ['required', 'in:'.implode(',', array_column($books, 'id'))],
            'end_book' => ['required', 'in:'.implode(',', array_column($books, 'id'))],
            'chapters_per_reading' => ['required', 'integer', 'between:1,20'],
            ...$this->scheduleRules(),
        ]);
        $start = array_search($data['start_book'], array_column($books, 'id'), true);
        $end = array_search($data['end_book'], array_column($books, 'id'), true);
        if ($start === false || $end === false || $end < $start) {
            throw ValidationException::withMessages(['end_book' => 'Choose an ending book at or after the starting book.']);
        }
        $selected = array_slice($books, $start, $end - $start + 1);
        $chapters = [];
        foreach ($selected as $book) {
            foreach (range(1, $book['chapters']) as $chapter) {
                $chapters[] = ['book' => $book['name'], 'chapter' => $chapter];
            }
        }
        $pace = (int) $data['chapters_per_reading'];
        if ($pace < 1 || $pace > 20) {
            throw ValidationException::withMessages(['chapters_per_reading' => 'Choose 1 to 20 chapters per reading.']);
        }
        $groups = array_chunk($chapters, $pace);
        $created = DB::transaction(function () use ($request, $data, $books, $start, $end, $groups): bool {
            $plan = $request->user()->customReadingPlans()->firstOrCreate(['slug' => 'custom-'.$request->user()->id.'-'.$data['creation_token']], [
                'name' => $data['name'], 'duration_days' => count($groups),
                'description' => $books[$start]['name'].' through '.$books[$end]['name'].' · '.$data['chapters_per_reading'].' chapters per reading.',
            ]);
            if (! $plan->wasRecentlyCreated) {
                return false;
            }
            foreach ($groups as $index => $group) {
                foreach ($group as $chapter) {
                    $plan->days()->create(['day_number' => $index + 1, 'book' => $chapter['book'], 'chapters' => (string) $chapter['chapter']]);
                }
            }
            $days = array_values(array_map('intval', $data['reading_days']));
            $request->user()->readingPlanProgress()->create([
                'reading_plan_id' => $plan->id, 'current_day' => 1, 'started_on' => today(), 'reading_days' => $days,
                'next_read_on' => $this->plans->nextDate(Carbon::parse($data['next_read_on']), $days),
            ]);

            return true;
        }, 3);
        Inertia::flash('toast', ['type' => 'success', 'message' => $created ? 'Your personal reading plan is ready.' : 'This plan was already created. Its progress is kept.']);

        return to_route('reading-plans.index');
    }

    public function store(Request $request, ReadingPlan $readingPlan): RedirectResponse
    {
        $this->visible($request, $readingPlan);
        $request->user()->readingPlanProgress()->firstOrCreate(['reading_plan_id' => $readingPlan->id], [
            'current_day' => 1, 'started_on' => today(), 'reading_days' => [0, 1, 2, 3, 4, 5, 6], 'next_read_on' => today(),
        ]);

        return to_route('reading-plans.index');
    }

    public function completeDay(Request $request, ReadingPlan $readingPlan): RedirectResponse
    {
        return $this->complete($request, $readingPlan, false);
    }

    public function catchUp(Request $request, ReadingPlan $readingPlan): RedirectResponse
    {
        return $this->complete($request, $readingPlan, true);
    }

    private function complete(Request $request, ReadingPlan $plan, bool $catchUp): RedirectResponse
    {
        $this->visible($request, $plan);
        $validated = $request->validate(['expected_day' => ['sometimes', 'integer', 'min:1']]);
        $progress = $request->user()->readingPlanProgress()->where('reading_plan_id', $plan->id)->firstOrFail();
        try {
            $advanced = $this->plans->advance($request->user(), $plan, (int) ($validated['expected_day'] ?? $progress->current_day), $catchUp);
        } catch (ValidationException $exception) {
            throw $exception->redirectTo(route('reading-plans.index'));
        }
        $complete = $progress->fresh()->current_day > $plan->duration_days;
        Inertia::flash('toast', ['type' => 'success', 'message' => $complete ? 'Congratulations! You completed '.$plan->name.'.' : ($advanced ? $advanced.' reading(s) completed. Your progress is saved.' : 'Your plan is already up to date.')]);

        return to_route('reading-plans.index');
    }

    public function pause(Request $request, ReadingPlan $readingPlan): RedirectResponse
    {
        return $this->setPaused($request, $readingPlan, true);
    }

    public function resume(Request $request, ReadingPlan $readingPlan): RedirectResponse
    {
        return $this->setPaused($request, $readingPlan, false);
    }

    private function setPaused(Request $request, ReadingPlan $plan, bool $paused): RedirectResponse
    {
        $this->visible($request, $plan);
        DB::transaction(function () use ($request, $plan, $paused): void {
            $progress = $request->user()->readingPlanProgress()->where('reading_plan_id', $plan->id)->lockForUpdate()->firstOrFail();
            if ($progress->current_day > $plan->duration_days || $progress->is_paused === $paused) {
                return;
            }
            $progress->is_paused = $paused;
            if (! $paused) {
                $progress->next_read_on = $this->plans->nextDate($progress->next_read_on && $progress->next_read_on->isFuture() ? $progress->next_read_on : today(), $progress->reading_days ?? [0, 1, 2, 3, 4, 5, 6]);
            }
            $progress->save();
        });

        return to_route('reading-plans.index');
    }

    public function updateSchedule(Request $request, ReadingPlan $readingPlan): RedirectResponse
    {
        $this->visible($request, $readingPlan);
        $data = $request->validate($this->scheduleRules());
        DB::transaction(function () use ($request, $readingPlan, $data): void {
            $progress = $request->user()->readingPlanProgress()->where('reading_plan_id', $readingPlan->id)->lockForUpdate()->firstOrFail();
            if ($progress->current_day > $readingPlan->duration_days) {
                throw ValidationException::withMessages(['readingPlan' => 'This plan is complete. Its progress is kept.']);
            }
            $days = array_values(array_map('intval', $data['reading_days']));
            $progress->update(['reading_days' => $days, 'next_read_on' => $this->plans->nextDate(Carbon::parse($data['next_read_on']), $days)]);
        });

        return to_route('reading-plans.index');
    }

    private function visible(Request $request, ReadingPlan $plan): void
    {
        abort_unless($plan->user_id === null || $plan->user_id === $request->user()->id, 404);
    }

    /** @return array<string, list<string>> */
    private function scheduleRules(): array
    {
        return [
            'reading_days' => ['required', 'array', 'min:1', 'max:7'], 'reading_days.*' => ['required', 'integer', 'between:0,6', 'distinct'],
            'next_read_on' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
        ];
    }
}
