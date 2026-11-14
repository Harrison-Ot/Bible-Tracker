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

export default function Chapters({
    bookId,
    translation,
    chapters,
}: ChaptersProps) {
    const bookName = chapters[0]?.book ?? bookId;

    return (
        <>
            <Head title={bookName} />
            <div className="bg-background min-h-screen">
                <div className="mx-auto max-w-3xl space-y-8 p-6 sm:p-10">
                    {/* Header */}
                    <div className="border-border border-b pb-6">
                        <Link
                            href={`/bible?translation=${encodeURIComponent(translation)}`}
                            className="text-primary hover:text-primary/80 inline-flex items-center gap-1 text-sm font-medium"
                        >
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                            All books
                        </Link>

                        <div className="mt-3 flex items-baseline gap-2">
                            <h1 className="text-foreground text-3xl font-bold tracking-tight">
                                {bookName}
                            </h1>
                            <span className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase">
                                {translation.toUpperCase()}
                            </span>
                        </div>
                        <p className="text-muted-foreground mt-1 text-sm">
                            {chapters.length} chapters — pick one to start
                            reading.
                        </p>
                    </div>

                    {chapters.length === 0 && (
                        <p
                            role="status"
                            className="bg-card text-muted-foreground rounded-xl border p-6 text-sm"
                        >
                            No chapters are available for this translation.
                            Return to All books to try another translation.
                        </p>
                    )}
                    {/* Chapter grid */}
                    <div className="grid grid-cols-5 gap-3 sm:grid-cols-6 md:grid-cols-8">
                        {chapters.map((c) => (
                            <Link
                                key={c.chapter}
                                href={`/bible/${bookId}/${c.chapter}?translation=${encodeURIComponent(translation)}`}
                                className="group border-border bg-card text-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground flex aspect-square items-center justify-center rounded-lg border text-base font-semibold shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
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
