<?php

namespace App\Services;

use App\Models\Badge;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class BadgeService
{
    public function __construct(private ReadingReportService $reports) {}

    /**
     * @param  array<string, mixed>|null  $report
     * @return list<array<string, mixed>>
     */
    public function forUser(User $user, ?array $report = null): array
    {
        $report ??= $this->reports->forUser($user);
        $keys = [];
        foreach ($report['milestones'] as $milestone) {
            $keys[] = $milestone['key'];
            if (! $milestone['achieved']) {
                continue;
            }
            $badge = Badge::query()->firstOrCreate(['key' => $milestone['key']], [
                'name' => $milestone['title'],
                'description' => match ($milestone['key']) {
                    'first_book' => 'Read every chapter of a Bible book.',
                    'first_plan' => 'Complete a reading plan.',
                    'chapters_1' => 'Read your first Bible chapter.',
                    default => 'Read '.$milestone['target'].' different Bible chapters.',
                },
                'icon' => $milestone['icon'],
            ]);
            // The unique user/badge constraint makes retries and concurrent awards safe.
            DB::table('user_badges')->insertOrIgnore([
                'user_id' => $user->id, 'badge_id' => $badge->id, 'earned_at' => now(),
            ]);
        }

        return array_values($user->badges()->whereIn('key', $keys)->orderByPivot('earned_at', 'desc')->orderBy('badges.id', 'desc')
            ->get()->map(fn (Badge $badge): array => [
                'key' => $badge->key, 'name' => $badge->name,
                'description' => $badge->description, 'icon' => $badge->icon,
                'earnedAt' => $badge->pivot->getAttribute('earned_at'),
            ])->all());
    }
}
