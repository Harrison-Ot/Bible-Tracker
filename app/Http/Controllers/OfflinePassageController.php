<?php

namespace App\Http\Controllers;

use App\Services\BibleCatalog;
use App\Services\BibleService;
use App\Services\OfflinePassageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OfflinePassageController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('downloads', ['books' => BibleCatalog::books()]);
    }

    public function show(Request $request, string $bookId, int $chapter, BibleService $bible, OfflinePassageService $offline): JsonResponse
    {
        $request->validate(['translation' => ['sometimes', 'in:web']]);

        return response()->json($offline->chapter($bookId, $chapter, $bible))->header('Cache-Control', 'private, no-store');
    }
}
