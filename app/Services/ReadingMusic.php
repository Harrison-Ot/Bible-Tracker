<?php

namespace App\Services;

class ReadingMusic
{
    /** @return list<array{id: string, title: string, url: string}> */
    public function songs(?string $directory = null): array
    {
        $directory ??= public_path('songs');
        $root = realpath($directory);
        if ($root === false || ! is_dir($root)) {
            return [];
        }

        $songs = [];
        foreach (scandir($root) ?: [] as $filename) {
            $path = $root.DIRECTORY_SEPARATOR.$filename;
            if (str_starts_with($filename, '.') || is_link($path) || ! is_file($path)) {
                continue;
            }
            if (! in_array(strtolower(pathinfo($filename, PATHINFO_EXTENSION)), ['mp3', 'm4a', 'ogg', 'wav', 'aac', 'flac', 'opus', 'webm'], true)) {
                continue;
            }
            $songs[] = [
                'id' => $filename,
                'title' => str_replace(['_', '-'], ' ', pathinfo($filename, PATHINFO_FILENAME)),
                'url' => '/songs/'.rawurlencode($filename),
            ];
        }
        usort($songs, fn (array $first, array $second): int => strnatcasecmp($first['title'], $second['title']));

        return $songs;
    }
}
