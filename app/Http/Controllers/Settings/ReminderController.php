<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use DateTimeZone;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReminderController extends Controller
{
    public function edit(Request $request): Response
    {
        $reminder = $request->user()->readingReminder()->first();

        return Inertia::render('settings/reminders', [
            'reminder' => [
                'enabled' => $reminder->enabled ?? false,
                'time' => $reminder->time ?? '08:00',
                'timezone' => $reminder->timezone ?? 'UTC',
                'days' => $reminder->days ?? [0, 1, 2, 3, 4, 5, 6],
            ],
            'timezones' => DateTimeZone::listIdentifiers(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'enabled' => ['required', 'boolean'],
            'time' => ['required', 'date_format:H:i'],
            'timezone' => ['required', 'string', 'max:64', 'timezone:all'],
            'days' => ['present', 'array', 'max:7', ...($request->boolean('enabled') ? ['min:1'] : [])],
            'days.*' => ['required', 'integer', 'between:0,6', 'distinct'],
        ]);
        $validated['days'] = array_values(array_map('intval', $validated['days']));
        $request->user()->readingReminder()->updateOrCreate([], $validated);

        return to_route('reminders.edit');
    }
}
