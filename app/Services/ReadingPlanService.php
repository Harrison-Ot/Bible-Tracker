<?php

namespace App\Services;

use App\Models\ReadingPlan;
use App\Models\User;
use App\Models\UserPlanProgress;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReadingPlanService
{
    /** @param list<int> $days */
    public function nextDate(CarbonInterface $from, array $days, bool $includeFrom = true): CarbonImmutable
    {
        $date = CarbonImmutable::instance($from)->startOfDay();
        if (! $includeFrom) {
            $date = $date->addDay();
        }
        for ($offset = 0; $offset < 7; $offset++) {
            if (in_array($date->dayOfWeek, $days, true)) {
                return $date;
            }
            $date = $date->addDay();
        }
        throw ValidationException::withMessages(['reading_days' => 'Choose at least one reading day.']);
    }

    /** @param list<string> $readKeys
     * @return list<array{book: string, chapter: int, reference: string, url: string, isRead: bool}> */
    public function readings(ReadingPlan $plan, int $day, array $readKeys = []): array
    {
        $readings = [];
        foreach ($plan->days()->where('day_number', $day)->get() as $reading) {
            $book = BibleCatalog::find($reading->book);
            if (! $book || ! preg_match('/^(\d+)(?:-(\d+))?$/', trim($reading->chapters), $match)) {
                return [];
            }
            $start = (int) $match[1];
            $end = (int) ($match[2] ?? $start);
            if ($start < 1 || $end < $start || $end > $book['chapters']) {
                return [];
            }
            foreach (range($start, $end) as $chapter) {
                $key = $book['id'].'-'.$chapter;
                $readings[$key] = [
                    'book' => $book['name'], 'chapter' => $chapter, 'reference' => $book['name'].' '.$chapter,
                    'url' => route('bible.show', ['bookId' => $book['id'], 'chapter' => $chapter]),
                    'isRead' => in_array($key, $readKeys, true),
                ];
            }
        }

        return array_values($readings);
    }

    /** @return list<string> */
    public function readKeys(User $user, UserPlanProgress $progress): array
    {
        return $this->readKeysSince($user, $progress->started_on);
    }

    /** @return list<string> */
    public function readKeysSince(User $user, CarbonInterface $start): array
    {
        $keys = [];
        foreach ($user->readingEntries()->whereDate('read_on', '>=', $start)->whereDate('read_on', '<=', today())->get(['book', 'chapter']) as $entry) {
            $book = BibleCatalog::find($entry->book);
            if ($book && $entry->chapter >= 1 && $entry->chapter <= $book['chapters']) {
                $keys[] = $book['id'].'-'.$entry->chapter;
            }
        }

        return array_values(array_unique($keys));
    }

    /** @return array<string, mixed> */
    public function forClient(ReadingPlan $plan, ?UserPlanProgress $progress, User $user): array
    {
        $readings = $progress && $progress->current_day <= $plan->duration_days
            ? $this->readings($plan, $progress->current_day, $this->readKeys($user, $progress)) : [];
        $complete = $progress && $progress->current_day > $plan->duration_days;
        $due = $progress && ! $complete ? ($progress->next_read_on ?? today())->toDateString() : null;

        return [
            'id' => $plan->id, 'name' => $plan->name, 'slug' => $plan->slug, 'description' => $plan->description,
            'isCustom' => $plan->user_id !== null, 'durationDays' => $plan->duration_days,
            'currentDay' => $progress?->current_day, 'startedOn' => $progress?->started_on?->toDateString(),
            'isComplete' => (bool) $complete, 'isPaused' => $progress->is_paused ?? false,
            'readingDays' => $progress->reading_days ?? [0, 1, 2, 3, 4, 5, 6],
            'nextReadOn' => $due, 'isOverdue' => $due !== null && $due < today()->toDateString() && ! $progress->is_paused,
            'todayReadings' => $readings,
            'isTodayComplete' => $readings !== [] && collect($readings)->every(fn ($reading) => $reading['isRead']),
        ];
    }

    public function advance(User $user, ReadingPlan $plan, int $expectedDay, bool $catchUp): int
    {
        return DB::transaction(function () use ($user, $plan, $expectedDay, $catchUp): int {
            $progress = $user->readingPlanProgress()->where('reading_plan_id', $plan->id)->lockForUpdate()->firstOrFail();
            if ($progress->is_paused) {
                throw ValidationException::withMessages(['readingPlan' => 'Resume this plan before completing readings.']);
            }
            if ($progress->current_day !== $expectedDay || $progress->current_day > $plan->duration_days) {
                return 0;
            }
            $keys = $this->readKeys($user, $progress);
            $advanced = 0;
            $due = $progress->next_read_on ?? today();
            do {
                $readings = $this->readings($plan, $progress->current_day, $keys);
                if ($readings === [] || ! collect($readings)->every(fn ($reading) => $reading['isRead'])) {
                    break;
                }
                DB::table('reading_plan_completions')->insertOrIgnore([
                    'user_plan_progress_id' => $progress->id, 'day_number' => $progress->current_day, 'completed_at' => now(),
                ]);
                $progress->current_day++;
                $advanced++;
                $due = $this->nextDate($due, $progress->reading_days ?? [0, 1, 2, 3, 4, 5, 6], false);
            } while ($catchUp && $progress->current_day <= $plan->duration_days);
            if ($advanced === 0) {
                throw ValidationException::withMessages(['readingPlan' => 'Log all passages for the next reading before continuing. Readings logged since this plan started count.']);
            }
            $progress->next_read_on = $progress->current_day > $plan->duration_days ? null : $due;
            $progress->completed_at = $progress->current_day > $plan->duration_days ? now() : null;
            $progress->save();

            return $advanced;
        }, 3);
    }
}
