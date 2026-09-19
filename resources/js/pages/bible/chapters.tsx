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

export default function Chapters({ bookId, translation, chapters }: ChaptersProps) {
    const bookName = chapters[0]?.book ?? bookId;

    return (
        <>
            <Head title={bookName} />
            <div className="min-h-screen bg-[#F7FAF6]">
                <div className="mx-auto max-w-3xl space-y-8 p-6 sm:p-10">
                    {/* Header */}
                    <div className="border-b border-[#D9E3D3] pb-6">
                        <Link
                            href="/bible"
                            className="inline-flex items-center gap-1 text-sm font-medium text-[#2F6B3C] hover:text-[#153D1D]"
                        >
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                            All books
                        </Link>

                        <div className="mt-3 flex items-baseline gap-2">
                            <h1 className="text-3xl font-bold tracking-tight text-[#16241A]">
                                {bookName}
                            </h1>
                            <span className="rounded-full bg-[#2F6B3C]/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-[#2F6B3C]">
                                {translation.toUpperCase()}
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-[#5B6B5D]">
                            {chapters.length} chapters — pick one to start reading.
                        </p>
                    </div>

                    {/* Chapter grid */}
                    <div className="grid grid-cols-5 gap-3 sm:grid-cols-6 md:grid-cols-8">
                        {chapters.map((c) => (
                            <Link
                                key={c.chapter}
                                href={`/bible/${bookId}/${c.chapter}`}
                                className="group flex aspect-square items-center justify-center rounded-lg border border-[#D9E3D3] bg-white text-base font-semibold text-[#16241A] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#2F6B3C] hover:bg-[#2F6B3C] hover:text-white hover:shadow-md active:translate-y-0"
                            >
                                {c.chapter}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}