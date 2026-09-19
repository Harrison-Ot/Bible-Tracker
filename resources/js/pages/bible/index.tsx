import { Head, Link } from '@inertiajs/react';

interface Book {
    id: string;
    name: string;
}

interface BibleIndexProps {
    translation: string;
    books: Book[];
}

export default function BibleIndex({ translation, books }: BibleIndexProps) {
    return (
        <>
            <Head title="The Bible" />
            <div className="min-h-screen bg-[#F7FAF6]">
                <div className="mx-auto max-w-4xl space-y-8 p-6 sm:p-10">
                    {/* Header */}
                    <div className="border-b border-[#D9E3D3] pb-6">
                        <span className="inline-block rounded-full bg-[#2F6B3C]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#2F6B3C]">
                            {translation.toUpperCase()}
                        </span>
                        <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#16241A]">
                            The Bible
                        </h1>
                        <p className="mt-1 text-sm text-[#5B6B5D]">
                            {books.length} books — pick one to see its chapters.
                        </p>
                    </div>

                    {/* Book grid */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                        {books.map((book) => (
                            <Link
                                key={book.id}
                                href={`/bible/${book.id}`}
                                className="group relative flex items-center justify-between rounded-lg border border-[#D9E3D3] bg-white px-4 py-3.5 text-sm font-medium text-[#16241A] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#2F6B3C] hover:shadow-md active:translate-y-0"
                            >
                                <span className="truncate">{book.name}</span>
                                <svg
                                    className="h-4 w-4 shrink-0 text-[#B9C7B4] transition-colors group-hover:text-[#2F6B3C]"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                                {/* left accent bar on hover */}
                                <span className="absolute left-0 top-1/2 h-0 w-0.5 -translate-y-1/2 bg-[#2F6B3C] transition-all duration-200 group-hover:h-2/3" />
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}