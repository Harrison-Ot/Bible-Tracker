<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ReadingEntryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\BibleController;
use App\Http\Controllers\AvatarController;


Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::post('/reading-entries', [ReadingEntryController::class, 'store'])
        ->name('reading-entries.store');
    Route::post('/avatar', [AvatarController::class, 'update'])->name('avatar.update');

    Route::delete('/reading-entries/{readingEntry}', [ReadingEntryController::class, 'destroy'])
        ->name('reading-entries.destroy');
    Route::get('/bible', [BibleController::class, 'index'])->name('bible.index');
    Route::get('/bible/{bookId}', [BibleController::class, 'chapters'])->name('bible.chapters');
    Route::get('/bible/{bookId}/{chapter}', [BibleController::class, 'show'])->name('bible.show');  
});

require __DIR__.'/settings.php';
