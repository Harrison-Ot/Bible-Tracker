<?php

namespace App\Http\Controllers;

use App\Models\ReadingReminder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReminderUnsubscribeController extends Controller
{
    public function show(Request $request, ReadingReminder $readingReminder): Response
    {
        return Inertia::render('reminders/unsubscribe', [
            'unsubscribed' => ! $readingReminder->enabled,
            'unsubscribeUrl' => $request->fullUrl(),
        ]);
    }

    public function store(Request $request, ReadingReminder $readingReminder): RedirectResponse
    {
        $readingReminder->update(['enabled' => false]);

        return redirect()->to($request->fullUrl());
    }
}
