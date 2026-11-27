<?php

namespace App\Http\Controllers;

use App\Services\BadgeService;
use App\Services\BibleCatalog;
use App\Services\ReadingReportService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReadingReportController extends Controller
{
    public function index(Request $request, ReadingReportService $reports, BadgeService $badges): Response
    {
        $report = $reports->forUser($request->user());
        $earned = array_column($badges->forUser($request->user(), $report), 'key');
        $report['milestones'] = array_map(fn (array $milestone): array => [...$milestone,
            'earned' => in_array($milestone['key'], $earned, true),
        ], $report['milestones']);

        return Inertia::render('reports', ['report' => $report]);
    }

    public function updateGoal(Request $request): RedirectResponse
    {
        $data = $request->validate(['weekly_chapter_goal' => ['required', 'integer', 'min:1', 'max:'.array_sum(array_column(BibleCatalog::books(), 'chapters'))]]);
        $request->user()->forceFill(['weekly_chapter_goal' => $data['weekly_chapter_goal']])->save();
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Weekly reading goal saved.']);

        return to_route('reports.index');
    }
}
