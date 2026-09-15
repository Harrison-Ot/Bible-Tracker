<?php

use App\Services\BibleService;
use Illuminate\Support\Facades\Http;

it('fetches and caches a chapter from the bible api', function () {
    Http::fake([
        'bible-api.com/data/web/JHN/3' => Http::response([
            'reference' => 'John 3',
            'verses' => [
                ['book_id' => 'JHN', 'book_name' => 'John', 'chapter' => 3, 'verse' => 16, 'text' => 'For God so loved the world...'],
            ],
        ], 200),
    ]);

    $service = new BibleService();
    $result = $service->getChapter('web', 'JHN', 3);

    expect($result['reference'])->toBe('John 3');
    expect($result['verses'])->toHaveCount(1);

    $service->getChapter('web', 'JHN', 3);
    Http::assertSentCount(1);
});

it('aborts with a 502 when the bible api is unreachable', function () {
    Http::fake([
        'bible-api.com/*' => Http::response(null, 500),
    ]);

    $service = new BibleService();

    expect(fn () => $service->getChapter('web', 'JHN', 3))
        ->toThrow(function ($e) {
            expect($e->getStatusCode())->toBe(502);
        });
});