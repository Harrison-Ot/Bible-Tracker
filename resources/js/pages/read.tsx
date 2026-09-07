import { Head, useForm } from '@inertiajs/react';

interface Verse {
    book_id: string;
    book_name: string;
    chapter: number;
    verse: number;
    text: string;
}

interface ReadProps {
    book: string;
    chapter: number;
    translation: string;
    passage: {
        reference?: string;
        verses: Verse[];
    };
}

export default function Read({ book, chapter, translation, passage }: ReadProps) {
    const { post, processing } = useForm({ book, chapter, translation });

    const markAsRead = () => {
        post('/reading-entries', { preserveScroll: true });
    };

    return (
        <>
            <Head title={`${book} ${chapter}`} />
            <div className="mx-auto max-w-2xl space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-medium text-[#16241A]">
                        {book} {chapter}
                    </h1>
                    <button
                        onClick={markAsRead}
                        disabled={processing}
                        className="rounded-full bg-[#2F6B3C] px-5 py-2 text-sm font-medium text-white hover:bg-[#153D1D] disabled:opacity-50"
                    >
                        {processing ? 'Saving…' : 'Mark as read'}
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
            </div>
        </>
    );
}