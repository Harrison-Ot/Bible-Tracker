<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\BibleCatalog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class OfflineReadingController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'client_id' => ['required', 'uuid'], 'owner_id' => ['required', 'integer'],
            'book_id' => ['required', Rule::in(array_column(BibleCatalog::books(), 'id'))],
            'chapter' => ['required', 'integer', 'between:1,150'], 'translation' => ['required', 'in:web'],
            'read_on' => ['required', 'date_format:Y-m-d', 'before_or_equal:today'],
        ]);
        abort_unless((int) $data['owner_id'] === $request->user()->id, 403, 'Sign in to the account that queued this reading.');
        $book = BibleCatalog::find($data['book_id']);
        if ($data['chapter'] > $book['chapters']) {
            throw ValidationException::withMessages(['chapter' => 'Choose a valid chapter for this book.']);
        }
        $values = ['book' => $book['name'], 'chapter' => (int) $data['chapter'], 'translation' => 'web', 'read_on' => $data['read_on']];
        $hash = hash('sha256', json_encode($values, JSON_THROW_ON_ERROR));
        $status = DB::transaction(function () use ($request, $data, $values, $hash): string {
            $user = User::query()->lockForUpdate()->findOrFail($request->user()->id);
            $receipt = DB::table('offline_reading_receipts')->where('user_id', $user->id)->where('client_id', $data['client_id'])->first();
            if ($receipt) {
                abort_unless(hash_equals($receipt->payload_hash, $hash), 409, 'This queued reading changed after it was synchronized.');

                return 'already_synced';
            }
            // Reconcile an online save whose response was lost; never overwrite its reflection.
            $entry = $user->readingEntries()->whereIn('book', [$values['book'], $data['book_id']])->where('chapter', $values['chapter'])
                ->where('translation', 'web')->whereDate('read_on', $values['read_on'])->first();
            $entry ??= $user->readingEntries()->create($values);
            DB::table('offline_reading_receipts')->insert(['user_id' => $user->id, 'client_id' => $data['client_id'], 'payload_hash' => $hash,
                'reading_entry_id' => $entry->id, 'created_at' => now(), 'updated_at' => now()]);

            return 'synced';
        }, 3);

        return response()->json(['client_id' => $data['client_id'], 'status' => $status])->header('Cache-Control', 'private, no-store');
    }
}
