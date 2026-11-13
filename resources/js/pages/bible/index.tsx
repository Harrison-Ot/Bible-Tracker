import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';

interface Book {
    id: string;
    name: string;
}

interface BibleIndexProps {
    translation: string;
    books: Book[];
}

export default function BibleIndex({ translation, books }: BibleIndexProps) {
    const [search, setSearch] = useState('');
    const matchingBooks = books.filter((book) =>
        `${book.name} ${book.id}`
            .toLowerCase()
            .includes(search.trim().toLowerCase()),
    );
    return (
        <>
            <Head title="The Bible" />
            <div className="min-h-screen bg-[#F7FAF6]">
                <div className="mx-auto max-w-4xl space-y-8 p-6 sm:p-10">
                    {/* Header */}
                    <div className="border-b border-[#D9E3D3] pb-6">
                        <span className="inline-block rounded-full bg-[#2F6B3C]/10 px-3 py-1 text-xs font-semibold tracking-wide text-[#2F6B3C] uppercase">
                            {translation.toUpperCase()}
                        </span>
                        <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#16241A]">
                            The Bible
                        </h1>
                        <p className="mt-1 text-sm text-[#5B6B5D]">
                            {books.length} books — pick one to see its chapters.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-end gap-4">
                        <div className="min-w-48 flex-1">
                            <label
                                htmlFor="book-search"
                                className="mb-2 block text-sm font-medium text-[#16241A]"
                            >
                                Find a book
                            </label>
                            <input
                                id="book-search"
                                type="search"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search by name or abbreviation"
                                className="w-full rounded-lg border border-[#D9E3D3] bg-white px-4 py-3 text-[#16241A] focus:ring-2 focus:ring-[#2F6B3C]"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="translation"
                                className="mb-2 block text-sm font-medium text-[#16241A]"
                            >
                                Translation
                            </label>
                            <select
                                id="translation"
                                value={translation}
                                onChange={(event) =>
                                    router.get('/bible', {
                                        translation: event.target.value,
                                    })
                                }
                                className="rounded-lg border border-[#D9E3D3] bg-white px-4 py-3 text-[#16241A]"
                            >
                                <option value="web">World English Bible</option>
                                <option value="kjv">King James Version</option>
                                {!['web', 'kjv'].includes(translation) && (
                                    <option value={translation}>
                                        {translation.toUpperCase()}
                                    </option>
                                )}
                            </select>
                        </div>
                    </div>
                    <p role="status" className="text-sm text-[#5B6B5D]">
                        {matchingBooks.length
                            ? `${matchingBooks.length} books available`
                            : 'No matching books. Try another name.'}
                    </p>
                    {/* Book grid */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                        {matchingBooks.map((book) => (
                            <Link
                                key={book.id}
                                href={`/bible/${book.id}?translation=${encodeURIComponent(translation)}`}
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
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M9 5l7 7-7 7"
                                    />
                                </svg>
                                {/* left accent bar on hover */}
                                <span className="absolute top-1/2 left-0 h-0 w-0.5 -translate-y-1/2 bg-[#2F6B3C] transition-all duration-200 group-hover:h-2/3" />
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
