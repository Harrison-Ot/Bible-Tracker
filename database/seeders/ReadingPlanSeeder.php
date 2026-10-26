<?php

namespace Database\Seeders;

use App\Models\PlanDay;
use App\Models\ReadingPlan;
use Illuminate\Database\Seeder;

class ReadingPlanSeeder extends Seeder
{
    /**
     * @var array<string, int>
     */
    private const BIBLE_BOOKS = [
        'Genesis' => 50, 'Exodus' => 40, 'Leviticus' => 27, 'Numbers' => 36,
        'Deuteronomy' => 34, 'Joshua' => 24, 'Judges' => 21, 'Ruth' => 4,
        '1 Samuel' => 31, '2 Samuel' => 24, '1 Kings' => 22, '2 Kings' => 25,
        '1 Chronicles' => 29, '2 Chronicles' => 36, 'Ezra' => 10, 'Nehemiah' => 13,
        'Esther' => 10, 'Job' => 42, 'Psalms' => 150, 'Proverbs' => 31,
        'Ecclesiastes' => 12, 'Song of Solomon' => 8, 'Isaiah' => 66, 'Jeremiah' => 52,
        'Lamentations' => 5, 'Ezekiel' => 48, 'Daniel' => 12, 'Hosea' => 14,
        'Joel' => 3, 'Amos' => 9, 'Obadiah' => 1, 'Jonah' => 4, 'Micah' => 7,
        'Nahum' => 3, 'Habakkuk' => 3, 'Zephaniah' => 3, 'Haggai' => 2,
        'Zechariah' => 14, 'Malachi' => 4,
        'Matthew' => 28, 'Mark' => 16, 'Luke' => 24, 'John' => 21,
        'Acts' => 28, 'Romans' => 16, '1 Corinthians' => 16, '2 Corinthians' => 13,
        'Galatians' => 6, 'Ephesians' => 6, 'Philippians' => 4, 'Colossians' => 4,
        '1 Thessalonians' => 5, '2 Thessalonians' => 3, '1 Timothy' => 6,
        '2 Timothy' => 4, 'Titus' => 3, 'Philemon' => 1, 'Hebrews' => 13,
        'James' => 5, '1 Peter' => 5, '2 Peter' => 3, '1 John' => 5,
        '2 John' => 1, '3 John' => 1, 'Jude' => 1, 'Revelation' => 22,
    ];

    /**
     * @var array<string, array{name: string, duration: int, books: list<string>}
     */
    private const PLANS = [
        'blueprint' => [
            'name' => 'The Blueprint',
            'duration' => 365,
            'books' => [],
        ],
        'new-testament-challenge' => [
            'name' => 'New Testament Challenge',
            'duration' => 90,
            'books' => [
                'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians',
                '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians',
                '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus',
                'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John',
                '3 John', 'Jude', 'Revelation',
            ],
        ],
        'gospels-only' => [
            'name' => 'The Gospels Only',
            'duration' => 30,
            'books' => ['Matthew', 'Mark', 'Luke', 'John'],
        ],
        'wisdom-literature' => [
            'name' => 'Wisdom Literature',
            'duration' => 15,
            'books' => ['Psalms', 'Proverbs', 'Ecclesiastes'],
        ],
    ];

    public function run(): void
    {
        foreach (self::PLANS as $slug => $definition) {
            $plan = ReadingPlan::query()->updateOrCreate(
                ['slug' => $slug],
                [
                    'name' => $definition['name'],
                    'duration_days' => $definition['duration'],
                ],
            );

            $plan->days()->delete();
            $chapters = $this->chaptersFor($definition['books']);
            $totalChapters = count($chapters);
            $offset = 0;

            for ($day = 1; $day <= $definition['duration']; $day++) {
                $startOffset = intdiv(($day - 1) * $totalChapters, $definition['duration']);
                $endOffset = intdiv($day * $totalChapters, $definition['duration']);
                $dailyCount = $endOffset - $startOffset;
                $dailyChapters = array_slice($chapters, $offset, $dailyCount);
                $offset += $dailyCount;

                foreach ($this->passages($dailyChapters) as $passage) {
                    PlanDay::query()->create([
                        'reading_plan_id' => $plan->id,
                        'day_number' => $day,
                        'book' => $passage['book'],
                        'chapters' => $passage['chapters'],
                    ]);
                }
            }
        }
    }

    /**
     * @param  list<string>  $books
     * @return list<array{book: string, chapter: int}>
     */
    private function chaptersFor(array $books): array
    {
        $selectedBooks = $books === [] ? array_keys(self::BIBLE_BOOKS) : $books;
        $chapters = [];

        foreach ($selectedBooks as $book) {
            for ($chapter = 1; $chapter <= self::BIBLE_BOOKS[$book]; $chapter++) {
                $chapters[] = ['book' => $book, 'chapter' => $chapter];
            }
        }

        return $chapters;
    }

    /**
     * @param  list<array{book: string, chapter: int}>  $chapters
     * @return list<array{book: string, chapters: string}>
     */
    private function passages(array $chapters): array
    {
        $passages = [];

        foreach ($chapters as $chapter) {
            $lastIndex = array_key_last($passages);

            if ($lastIndex !== null && $passages[$lastIndex]['book'] === $chapter['book']) {
                $passages[$lastIndex]['end'] = $chapter['chapter'];

                continue;
            }

            $passages[] = [
                'book' => $chapter['book'],
                'start' => $chapter['chapter'],
                'end' => $chapter['chapter'],
            ];
        }

        return array_map(static fn (array $passage): array => [
            'book' => $passage['book'],
            'chapters' => $passage['start'] === $passage['end']
                ? (string) $passage['start']
                : $passage['start'].'-'.$passage['end'],
        ], $passages);
    }
}
