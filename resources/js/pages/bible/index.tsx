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
            <div className="mx-auto max-w-3xl space-y-6 p-6">
                <div>
                    <h1 className="text-2xl font-medium text-[#16241A]">The Bible</h1>
                    <p className="text-sm text-[#5B6B5D]">
                        {translation.toUpperCase()} translation — pick a book to see its chapters.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {books.map((book) => (
                        <Link
                            key={book.id}
                            href={`/bible/${book.id}`}
                            className="rounded-md border border-[#D9E3D3] bg-white px-4 py-3 text-sm text-[#16241A] hover:border-[#2F6B3C] hover:bg-[#2F6B3C]/5"
                        >
                            {book.name}
                        </Link>
                    ))}
                </div>
            </div>
        </>
    );
}