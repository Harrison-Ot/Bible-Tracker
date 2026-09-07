import { Head, Link, useForm } from '@inertiajs/react';

interface Verse {
    book_id: string;
    book_name: string;
    chapter: number;
    verse: number;
    text: string;
}

interface ReadProps {
    bookId: string;
    chapter: number;
    translation: string;
    passage: {
        verses: Verse[];
    };
}

export default function Read({ bookId, chapter, translation, passage }: ReadProps) {
    const bookName = passage.verses[0]?.book_name ?? bookId;

    const { post, processing, recentlySuccessful } = useForm({
        book: bookName,
        chapter,
        translation,
    });

    const markAsRead = () => {
        post('/reading-entries', { preserveScroll: true });
    };

    const prevChapter = chapter > 1 ? chapter - 1 : null;
    const nextChapter = chapter + 1;

    return (
        <>
            <Head title={`${bookName} ${chapter}`} />
            <div className="mx-auto max-w-2xl space-y-6 p-6">
                <Link href={`/bible/${bookId}`} className="text-sm text-[#2F6B3C] underline">
                    ← {bookName} chapters
                </Link>

                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-medium text-[#16241A]">
                        {bookName} {chapter}
                    </h1>
                    <button
                        onClick={markAsRead}
                        disabled={processing}
                        className="rounded-full bg-[#2F6B3C] px-5 py-2 text-sm font-medium text-white hover:bg-[#153D1D] disabled:opacity-50"
                    >
                        {processing ? 'Saving…' : recentlySuccessful ? 'Marked ✓' : 'Mark as read'}
                    </button>
                </div>

                <div className="space-y-3 rounded-lg border border-[#D9E3D3] bg-white p-6 leading-relaxed text-[#16241A]">
                    {passage.verses.map((v) => (
                        <p key={v.verse}>
                            <sup className="mr-1 text-xs text-[#8FA491]">{v.verse}</sup>
                            {v.text}
                        </p>
                    ))}
                </div>

                <div className="flex justify-between text-sm">
                    {prevChapter ? (
                        <Link href={`/bible/${bookId}/${prevChapter}`} className="text-[#2F6B3C] underline">
                            ← Chapter {prevChapter}
                        </Link>
                    ) : (
                        <span />
                    )}
                    <Link href={`/bible/${bookId}/${nextChapter}`} className="text-[#2F6B3C] underline">
                        Chapter {nextChapter} →
                    </Link>
                </div>
            </div>
        </>
    );
}