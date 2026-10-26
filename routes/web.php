<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ReadingEntryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\BibleController;
use App\Http\Controllers\AvatarController;
use App\Http\Controllers\ConnectionRequestController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\NotificationController;


Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/members', [MemberController::class, 'index'])->name('members.index');
    Route::post('/members/{user}/connections', [ConnectionRequestController::class, 'store'])->name('connections.store');
    Route::patch('/connections/{connectionRequest}', [ConnectionRequestController::class, 'update'])->name('connections.update');
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'update'])->name('notifications.read');
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
