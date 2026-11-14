<?php

namespace App\Console\Commands;

use App\Models\ReadingReminder;
use App\Notifications\ReadingReminderNotification;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class SendReadingReminders extends Command
{
    protected $signature = 'readings:send-reminders {--dry-run : Count due reminders without sending mail or recording attempts}';

    protected $description = 'Deliver opt-in reading reminders in each reader\'s timezone';

    public function handle(): int
    {
        $now = CarbonImmutable::now('UTC');
        $due = 0;
        $failed = 0;
        ReadingReminder::query()->where('enabled', true)->whereHas('user', fn ($query) => $query->whereNotNull('email_verified_at'))
            ->chunkById(100, function ($reminders) use ($now, &$due, &$failed): void {
                foreach ($reminders as $candidate) {
                    // Recheck under a row lock so preference changes and concurrent runs
                    // cannot independently claim the same reminder for a local date.
                    $reminder = DB::transaction(function () use ($candidate, $now): ?ReadingReminder {
                        $reminder = ReadingReminder::query()->with('user')->lockForUpdate()->find($candidate->id);
                        if (! $reminder || ! $reminder->enabled || ! $reminder->user?->hasVerifiedEmail()) {
                            return null;
                        }
                        $local = $now->setTimezone($reminder->timezone);
                        [$hour, $minute] = array_map('intval', explode(':', $reminder->time));
                        $minutesLate = ($local->hour * 60 + $local->minute) - ($hour * 60 + $minute);
                        if (! in_array($local->dayOfWeek, $reminder->days, true) || $minutesLate < 0 || $minutesLate >= 15) {
                            return null;
                        }
                        $attempt = ['reading_reminder_id' => $reminder->id, 'delivery_date' => $local->toDateString()];
                        if ($this->option('dry-run')) {
                            return DB::table('reading_reminder_deliveries')->where($attempt)->exists() ? null : $reminder;
                        }
                        // A durable unique claim prevents repeats even after a crash or
                        // ambiguous transport failure. Failed attempts are not auto-retried.
                        $claimed = DB::table('reading_reminder_deliveries')->insertOrIgnore([
                            ...$attempt, 'status' => 'pending', 'created_at' => $now, 'updated_at' => $now,
                        ]);

                        return $claimed === 1 ? $reminder : null;
                    });
                    if (! $reminder) {
                        continue;
                    }
                    $due++;
                    if ($this->option('dry-run')) {
                        continue;
                    }
                    $date = $now->setTimezone($reminder->timezone)->toDateString();
                    $status = 'skipped';
                    try {
                        // A last check also respects opt-outs after claiming a delivery.
                        $reminder->refresh()->load('user');
                        if ($reminder->enabled && $reminder->user?->hasVerifiedEmail()) {
                            $reminder->user->notifyNow(new ReadingReminderNotification($reminder));
                            $status = 'sent';
                        }
                    } catch (Throwable $exception) {
                        $status = 'failed';
                        $failed++;
                        Log::warning('Reading reminder delivery failed.', ['reminder_id' => $reminder->id, 'exception' => $exception::class]);
                    }
                    DB::table('reading_reminder_deliveries')
                        ->where('reading_reminder_id', $reminder->id)->where('delivery_date', $date)
                        ->update(['status' => $status, 'updated_at' => now()]);
                }
            });
        $this->info($this->option('dry-run') ? "{$due} reminder(s) due. No mail sent." : "{$due} reminder attempt(s); {$failed} failed.");

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }
}
