<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Carbon;

class ReadingReportService
{
    /** @return array<string, mixed> */
    public function forUser(User $user): array
    {
        $catalog = BibleCatalog::books();
        $totalChapters = array_sum(array_column($catalog, 'chapters'));
        $bookReads = [];
        $dates = [];
        $weeks = [];
        $weekStart = today()->startOfWeek(Carbon::MONDAY);
        foreach (range(7, 0) as $offset) {
            $start = $weekStart->copy()->subWeeks($offset);
            $weeks[$start->toDateString()] = ['start' => $start->toDateString(), 'end' => $start->copy()->addDays(6)->toDateString(), 'chapters' => [], 'days' => []];
        }
        $logs = 0;
        foreach ($user->readingEntries()->whereDate('read_on', '<=', today())->get(['book', 'chapter', 'read_on']) as $entry) {
            $book = BibleCatalog::find($entry->book);
            if (! $book || $entry->chapter < 1 || $entry->chapter > $book['chapters']) {
                continue;
            }
            $logs++;
            $key = $book['id'].'-'.$entry->chapter;
            $date = $entry->read_on->toDateString();
            $bookReads[$book['id']][$entry->chapter] = true;
            $dates[$date] = true;
            $week = $entry->read_on->copy()->startOfWeek(Carbon::MONDAY)->toDateString();
            if (isset($weeks[$week])) {
                $weeks[$week]['chapters'][$key] = true;
                $weeks[$week]['days'][$date] = true;
            }
        }
        $books = array_map(function ($book) use ($bookReads): array {
            $read = count($bookReads[$book['id']] ?? []);

            return ['id' => $book['id'], 'name' => $book['name'], 'total' => $book['chapters'], 'read' => $read,
                'percent' => round($read / $book['chapters'] * 100, 1), 'complete' => $read === $book['chapters'], 'url' => route('bible.chapters', ['bookId' => $book['id']])];
        }, $catalog);
        $unique = array_sum(array_column($books, 'read'));
        $completedBooks = count(array_filter($books, fn ($book) => $book['complete']));
        $completedPlans = $user->readingPlanProgress()->whereHas('plan', fn ($query) => $query
            ->where(fn ($visible) => $visible->whereNull('user_id')->orWhere('user_id', $user->id))
            ->whereColumn('user_plan_progress.current_day', '>', 'reading_plans.duration_days'))->count();
        $weeklyGoal = max(1, (int) ($user->weekly_chapter_goal ?? 7));
        $weeks = array_values(array_map(fn ($week): array => ['start' => $week['start'], 'end' => $week['end'],
            'chapters' => count($week['chapters']), 'days' => count($week['days'])], $weeks));
        $thisWeek = $weeks[array_key_last($weeks)];
        $milestones = [];
        foreach ([1 => 'Your first chapter', 10 => 'Ten chapters', 50 => 'Fifty chapters', 100 => 'One hundred chapters', 250 => 'A growing foundation', 500 => 'Five hundred chapters', $totalChapters => 'The whole Bible'] as $target => $title) {
            $milestones[] = ['title' => $title, 'current' => $unique, 'target' => $target, 'unit' => 'unique chapters', 'achieved' => $unique >= $target];
        }
        $milestones[] = ['title' => 'Your first complete book', 'current' => $completedBooks, 'target' => 1, 'unit' => 'books', 'achieved' => $completedBooks >= 1];
        $milestones[] = ['title' => 'Your first completed plan', 'current' => $completedPlans, 'target' => 1, 'unit' => 'plans', 'achieved' => $completedPlans >= 1];

        return [
            'uniqueChapters' => $unique, 'totalChapters' => $totalChapters, 'percent' => round($unique / $totalChapters * 100, 1),
            'completedBooks' => $completedBooks, 'completedPlans' => $completedPlans, 'readingDays' => count($dates), 'loggedReadings' => $logs,
            'weeklyGoal' => $weeklyGoal, 'thisWeek' => $thisWeek, 'weeks' => $weeks, 'books' => $books, 'milestones' => $milestones,
        ];
    }
}
