<?php

namespace App\Http\Controllers;

use App\Models\Group;
use App\Models\ReadingPlan;
use App\Services\GroupAccess;
use App\Services\ReadingPlanService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class GroupReadingController extends Controller
{
    public function __construct(private GroupAccess $access, private ReadingPlanService $readings) {}

    public function store(Request $request, Group $group): RedirectResponse
    {
        DB::transaction(function () use ($request, $group): void {
            $group = $this->access->locked($request->user(), $group, 'manager');
            $data = $request->validate(['reading_plan_id' => ['required', 'integer'], 'creation_token' => ['required', 'uuid']]);
            $plan = ReadingPlan::query()->whereKey($data['reading_plan_id'])->whereNull('user_id')->first();
            if (! $plan) {
                throw ValidationException::withMessages(['reading_plan_id' => 'Choose a guided plan from the list.']);
            }
            $run = $group->runs()->firstOrCreate(['creation_token' => $data['creation_token']], ['reading_plan_id' => $plan->id, 'started_on' => today()]);
            if (! $run->wasRecentlyCreated) {
                return;
            }
            $group->runs()->whereKey($group->current_run_id)->update(['archived_at' => now()]);
            $group->update(['current_run_id' => $run->id]);
        }, 3);

        return to_route('groups.show', $group);
    }

    public function checkIn(Request $request, Group $group): RedirectResponse
    {
        DB::transaction(function () use ($request, $group): void {
            $group = $this->access->locked($request->user(), $group);
            $data = $request->validate(['run_id' => ['required', 'integer'], 'expected_day' => ['required', 'integer', 'min:1']]);
            $run = $group->runs()->whereKey($group->current_run_id)->with('plan')->firstOrFail();
            if ($run->id !== (int) $data['run_id'] || $run->current_day !== (int) $data['expected_day'] || $run->current_day > $run->plan->duration_days) {
                throw ValidationException::withMessages(['reading' => 'The group reading changed. Refresh the page to see the current passages.']);
            }
            $readings = $this->readings->readings($run->plan, $run->current_day, $this->readings->readKeysSince($request->user(), $run->started_on));
            if ($readings === [] || ! collect($readings)->every(fn ($reading) => $reading['isRead'])) {
                throw ValidationException::withMessages(['reading' => 'Log all assigned passages before sharing your check-in with this group.']);
            }
            DB::table('group_reading_checkins')->insertOrIgnore(['group_reading_run_id' => $run->id, 'user_id' => $request->user()->id, 'day_number' => $run->current_day, 'checked_in_at' => now()]);
        }, 3);

        return to_route('groups.show', $group);
    }

    public function advance(Request $request, Group $group): RedirectResponse
    {
        DB::transaction(function () use ($request, $group): void {
            $group = $this->access->locked($request->user(), $group, 'manager');
            $data = $request->validate(['run_id' => ['required', 'integer'], 'expected_day' => ['required', 'integer', 'min:1']]);
            $run = $group->runs()->whereKey($group->current_run_id)->with('plan')->firstOrFail();
            if ($run->id !== (int) $data['run_id'] || $run->current_day !== (int) $data['expected_day'] || $run->completed_at) {
                return;
            }
            $run->current_day++;
            if ($run->current_day > $run->plan->duration_days) {
                $run->completed_at = now();
            }
            $run->save();
        }, 3);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Group reading updated. Personal reading progress is unchanged.']);

        return to_route('groups.show', $group);
    }
}
