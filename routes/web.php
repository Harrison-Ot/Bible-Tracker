<?php

use App\Http\Controllers\AvatarController;
use App\Http\Controllers\BibleController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\ConnectionRequestController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ReadingEntryController;
use App\Http\Controllers\ReadingPlanController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/reading-plans', [ReadingPlanController::class, 'index'])->name('reading-plans.index');
    Route::post('/reading-plans/{readingPlan}/start', [ReadingPlanController::class, 'store'])->name('reading-plans.store');
    Route::post('/reading-plans/{readingPlan}/complete-day', [ReadingPlanController::class, 'completeDay'])->name('reading-plans.complete-day');
    Route::get('/members', [MemberController::class, 'index'])->name('members.index');
    Route::get('/chats', [ChatController::class, 'index'])->name('chats.index');
    Route::post('/chats/{user}/messages', [ChatController::class, 'store'])
        ->middleware('throttle:30,1')
        ->name('chats.messages.store');
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
