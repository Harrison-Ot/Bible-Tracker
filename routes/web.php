<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ReadingEntryController;
use App\Http\Controllers\DashboardController;


Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::post('/reading-entries', [ReadingEntryController::class, 'store'])
        ->name('reading-entries.store');

    Route::delete('/reading-entries/{readingEntry}', [ReadingEntryController::class, 'destroy'])
        ->name('reading-entries.destroy');
});

require __DIR__.'/settings.php';
