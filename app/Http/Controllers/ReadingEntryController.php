<?php

namespace App\Http\Controllers;

use App\Models\ReadingEntry;
use App\Services\BibleCatalog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ReadingEntryController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'book' => ['required', 'string', 'max:50'],
            'chapter' => ['required', 'integer', 'min:1', 'max:200'],
            'translation' => ['nullable', 'string', 'max:10'],
            'note' => ['nullable', 'string', 'max:1000'],
            'read_on' => ['nullable', 'date_format:Y-m-d', 'before_or_equal:today'],
        ]);

        $book = BibleCatalog::find($validated['book']);
        if (! $book) {
            throw ValidationException::withMessages(['book' => 'Choose a book of the Bible.']);
        }
        if ($validated['chapter'] > $book['chapters']) {
            throw ValidationException::withMessages(['chapter' => 'This book has '.$book['chapters'].' chapters.']);
        }

        $request->user()->readingEntries()->create([
            'book' => $book['name'],
            'chapter' => $validated['chapter'],
            'translation' => $validated['translation'] ?? 'web',
            'note' => $validated['note'] ?? null,
            'read_on' => $validated['read_on'] ?? today(),
        ]);

        return to_route('dashboard')->with('success', 'Reading logged.');
    }

    public function update(Request $request, ReadingEntry $readingEntry): RedirectResponse
    {
        abort_unless($readingEntry->user_id === $request->user()->id, 403);
        $validated = $request->validate([
            'note' => ['present', 'nullable', 'string', 'max:1000'],
        ]);
        $readingEntry->update(['note' => $validated['note']]);

        return back()->with('success', 'Reflection updated.');
    }

    public function destroy(ReadingEntry $readingEntry): RedirectResponse
    {
        // only the owner can delete their own entry
        abort_unless($readingEntry->user_id === request()->user()->id, 403);

        $readingEntry->delete();

        return back()->with('success', 'Entry removed.');
    }
}
