<?php

namespace App\Http\Controllers;

use App\Models\ReadingEntry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ReadingEntryController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'book' => ['required', 'string', 'max:50'],
            'chapter' => ['required', 'integer', 'min:1', 'max:200'],
            'translation' => ['nullable', 'string', 'max:10'],
            'note' => ['nullable', 'string', 'max:1000'],
            'read_on' => ['nullable', 'date'],
        ]);

        $request->user()->readingEntries()->create([
            'book' => $validated['book'],
            'chapter' => $validated['chapter'],
            'translation' => $validated['translation'] ?? 'web',
            'note' => $validated['note'] ?? null,
            'read_on' => $validated['read_on'] ?? today(),
        ]);

        return back()->with('success', 'Reading logged.');
    }

    public function destroy(ReadingEntry $readingEntry): RedirectResponse
    {
        // only the owner can delete their own entry
        abort_unless($readingEntry->user_id === request()->user()->id, 403);

        $readingEntry->delete();

        return back()->with('success', 'Entry removed.');
    }
}