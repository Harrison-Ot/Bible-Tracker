<?php

use App\Http\Controllers\AvatarController;
use App\Http\Controllers\BibleController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\ConnectionRequestController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GroupController;
use App\Http\Controllers\GroupMembershipController;
use App\Http\Controllers\GroupPostController;
use App\Http\Controllers\GroupReadingController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ReadingEntryController;
use App\Http\Controllers\ReadingJournalController;
use App\Http\Controllers\ReadingPlanController;
use App\Http\Controllers\ReadingReportController;
use App\Http\Controllers\ReminderUnsubscribeController;
use App\Http\Controllers\SavedVerseController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/groups', [GroupController::class, 'index'])->name('groups.index');
    Route::post('/groups', [GroupController::class, 'store'])->middleware('throttle:10,1')->name('groups.store');
    Route::get('/groups/{group}', [GroupController::class, 'show'])->name('groups.show');
    Route::patch('/groups/{group}', [GroupController::class, 'update'])->name('groups.update');
    Route::delete('/groups/{group}', [GroupController::class, 'destroy'])->name('groups.destroy');
    Route::patch('/groups/{group}/discussion-lock', [GroupController::class, 'lock'])->name('groups.lock');
    Route::post('/groups/{group}/invitations', [GroupMembershipController::class, 'invite'])->middleware('throttle:30,1')->name('groups.invite');
    Route::patch('/group-invitations/{groupInvitation}', [GroupMembershipController::class, 'respond'])->name('group-invitations.respond');
    Route::delete('/groups/{group}/invitations/{groupInvitation}', [GroupMembershipController::class, 'revoke'])->name('groups.revoke');
    Route::patch('/groups/{group}/members/{member}', [GroupMembershipController::class, 'role'])->name('groups.role');
    Route::delete('/groups/{group}/members/{member}', [GroupMembershipController::class, 'remove'])->name('groups.remove');
    Route::post('/groups/{group}/leave', [GroupMembershipController::class, 'leave'])->name('groups.leave');
    Route::post('/groups/{group}/ownership', [GroupMembershipController::class, 'transfer'])->name('groups.transfer');
    Route::post('/groups/{group}/reading-plan', [GroupReadingController::class, 'store'])->name('groups.plan');
    Route::post('/groups/{group}/check-in', [GroupReadingController::class, 'checkIn'])->name('groups.check-in');
    Route::post('/groups/{group}/advance', [GroupReadingController::class, 'advance'])->name('groups.advance');
    Route::post('/groups/{group}/posts', [GroupPostController::class, 'store'])->middleware('throttle:30,1')->name('groups.posts.store');
    Route::delete('/groups/{group}/posts/{groupPost}', [GroupPostController::class, 'destroy'])->name('groups.posts.destroy');
    Route::get('/saved-verses', [SavedVerseController::class, 'index'])->name('saved-verses.index');
    Route::put('/saved-verses', [SavedVerseController::class, 'store'])->middleware('throttle:120,1')->name('saved-verses.store');
    Route::post('/saved-verses/import', [SavedVerseController::class, 'import'])->middleware('throttle:60,1')->name('saved-verses.import');
    Route::delete('/saved-verses/highlights', [SavedVerseController::class, 'clearHighlights'])->name('saved-verses.clear-highlights');
    Route::delete('/saved-verses/{savedVerse}', [SavedVerseController::class, 'destroy'])->name('saved-verses.destroy');
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/journal', [ReadingJournalController::class, 'index'])->name('journal.index');
    Route::patch('/reading-entries/{readingEntry}', [ReadingEntryController::class, 'update'])->name('reading-entries.update');
    Route::get('/reading-plans/create', [ReadingPlanController::class, 'create'])->name('reading-plans.create');
    Route::post('/reading-plans', [ReadingPlanController::class, 'storeCustom'])->name('reading-plans.custom');
    Route::post('/reading-plans/{readingPlan}/pause', [ReadingPlanController::class, 'pause'])->name('reading-plans.pause');
    Route::post('/reading-plans/{readingPlan}/resume', [ReadingPlanController::class, 'resume'])->name('reading-plans.resume');
    Route::post('/reading-plans/{readingPlan}/catch-up', [ReadingPlanController::class, 'catchUp'])->name('reading-plans.catch-up');
    Route::patch('/reading-plans/{readingPlan}/schedule', [ReadingPlanController::class, 'updateSchedule'])->name('reading-plans.schedule');
    Route::get('/reports', [ReadingReportController::class, 'index'])->name('reports.index');
    Route::patch('/reports/goal', [ReadingReportController::class, 'updateGoal'])->name('reports.goal');
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

// Signed links identify only the reminder being disabled. GET does not mutate settings.
Route::get('/reading-reminders/{readingReminder}/unsubscribe', [ReminderUnsubscribeController::class, 'show'])
    ->middleware('signed')->name('reminders.unsubscribe');
Route::post('/reading-reminders/{readingReminder}/unsubscribe', [ReminderUnsubscribeController::class, 'store'])
    ->middleware(['signed', 'throttle:10,1'])->name('reminders.unsubscribe.store');
