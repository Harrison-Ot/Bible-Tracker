<?php

use App\Services\ReadingMusic;

it('discovers only supported visible audio files with encoded urls and natural titles', function () {
    $directory = sys_get_temp_dir().'/bible-music-'.bin2hex(random_bytes(8));
    mkdir($directory);
    mkdir($directory.'/nested');
    $files = ['02_Quiet-Prayer.MP3', '01 Amazing Grace.mp3', 'notes.txt', '.hidden.mp3'];
    try {
        foreach ($files as $file) {
            file_put_contents($directory.'/'.$file, 'test fixture');
        }
        expect((new ReadingMusic)->songs($directory))->toBe([
            ['id' => '01 Amazing Grace.mp3', 'title' => '01 Amazing Grace', 'url' => '/songs/01%20Amazing%20Grace.mp3'],
            ['id' => '02_Quiet-Prayer.MP3', 'title' => '02 Quiet Prayer', 'url' => '/songs/02_Quiet-Prayer.MP3'],
        ]);
        expect((new ReadingMusic)->songs($directory.'/missing'))->toBe([]);
    } finally {
        foreach ($files as $file) {
            unlink($directory.'/'.$file);
        }
        rmdir($directory.'/nested');
        rmdir($directory);
    }
});
