import { Head, Link } from '@inertiajs/react';

interface Chapter {
    book: string;
    chapter: number;
}

interface ChaptersProps {
    bookId: string;
    translation: string;
    chapters: Chapter[];
}

export default function Chapters({ bookId, chapters }: ChaptersProps) {
    const bookName = chapters[0]?.book ?? bookId;

    return (
        <>
            <Head title={bookName} />
            <div className="mx-auto max-w-3xl space-y-6 p-6">
                <div>
                    <Link href="/bible" className="text-sm text-[#2F6B3C] underline">
                        ← All books
                    </Link>
                    <h1 className="mt-2 text-2xl font-medium text-[#16241A]">{bookName}</h1>
                </div>

                <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
                    {chapters.map((c) => (
                        <Link
                            key={c.chapter}
                            href={`/bible/${bookId}/${c.chapter}`}
                            className="flex h-10 items-center justify-center rounded-md border border-[#D9E3D3] bg-white text-sm text-[#16241A] hover:border-[#2F6B3C] hover:bg-[#2F6B3C]/5"
                        >
                            {c.chapter}
                        </Link>
                    ))}
                </div>
            </div>
        </>
    );
}