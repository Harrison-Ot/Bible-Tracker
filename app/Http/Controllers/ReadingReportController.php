<?php

namespace App\Http\Controllers;

use App\Services\BibleCatalog;
use App\Services\ReadingReportService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReadingReportController extends Controller
{
    public function index(Request $request, ReadingReportService $reports): Response
    {
        return Inertia::render('reports', ['report' => $reports->forUser($request->user())]);
    }

    public function updateGoal(Request $request): RedirectResponse
    {
        $data = $request->validate(['weekly_chapter_goal' => ['required', 'integer', 'min:1', 'max:'.array_sum(array_column(BibleCatalog::books(), 'chapters'))]]);
        $request->user()->forceFill(['weekly_chapter_goal' => $data['weekly_chapter_goal']])->save();
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Weekly reading goal saved.']);

        return to_route('reports.index');
    }
}
