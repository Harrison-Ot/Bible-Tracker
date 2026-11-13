<?php

use App\Services\BibleService;
use Illuminate\Support\Facades\Http;
use Symfony\Component\HttpKernel\Exception\HttpException;

it('fetches and caches a chapter from the bible api', function () {
    Http::fake([
        'bible-api.com/data/web/JHN/3' => Http::response([
            'reference' => 'John 3',
            'verses' => [
                ['book_id' => 'JHN', 'book_name' => 'John', 'chapter' => 3, 'verse' => 16, 'text' => 'For God so loved the world...'],
            ],
        ], 200),
    ]);

    $service = new BibleService;
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

    $service = new BibleService;

    try {
        $service->getChapter('web', 'JHN', 3);
        test()->fail('Expected the Bible API failure to abort the request.');
    } catch (HttpException $exception) {
        expect($exception->getStatusCode())->toBe(502);
    }
});

it('handles connection failures as provider errors', function () {
    Http::fake(['bible-api.com/*' => Http::failedConnection()]);
    try {
        (new BibleService)->getChapter('web', 'JHN', 3);
        test()->fail('Expected a provider error.');
    } catch (HttpException $exception) {
        expect($exception->getStatusCode())->toBe(502);
    }
});

it('rejects malformed successful responses without caching them', function () {
    Http::fake(['bible-api.com/*' => Http::sequence()->push(['error' => 'bad payload'])->push(['verses' => []])]);
    try {
        (new BibleService)->getChapter('web', 'JHN', 3);
        test()->fail('Expected an invalid response error.');
    } catch (HttpException $exception) {
        expect($exception->getStatusCode())->toBe(502);
    }
    expect((new BibleService)->getChapter('web', 'JHN', 3))->toBe(['verses' => []]);
    Http::assertSentCount(2);
});
