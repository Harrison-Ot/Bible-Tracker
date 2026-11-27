<?php

namespace App\Providers;

use App\Models\ReadingEntry;
use App\Models\UserPlanProgress;
use App\Services\BadgeService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();

        ReadingEntry::saved(function (ReadingEntry $entry): void {
            if ($entry->user) {
                app(BadgeService::class)->forUser($entry->user);
            }
        });
        UserPlanProgress::saved(function (UserPlanProgress $progress): void {
            if (($progress->wasRecentlyCreated || $progress->wasChanged('current_day')) && $progress->user) {
                app(BadgeService::class)->forUser($progress->user);
            }
        });
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
