import { Link, router } from '@inertiajs/react';
import { useState } from 'react';

export interface ReadingHistoryPage {
    data: {
        id: number;
        book: string;
        chapter: number;
        readOn: string;
        translation: string;
        note: string | null;
    }[];
    prev_page_url: string | null;
    next_page_url: string | null;
    total: number;
}

export default function ReadingHistory({
    readings,
}: {
    readings: ReadingHistoryPage;
}) {
    const [deleting, setDeleting] = useState<number | null>(null);
    const remove = (id: number) => {
        if (!window.confirm('Remove this reading and its note?')) return;
        setDeleting(id);
        router.delete(`/reading-entries/${id}`, {
            preserveScroll: true,
            onFinish: () => setDeleting(null),
        });
    };
    return (
        <section
            aria-labelledby="history-heading"
            className="rounded-xl border border-[#D9E3D3] bg-white p-6 text-[#16241A] shadow-sm"
        >
            <div className="flex items-center justify-between gap-4">
                <h2 id="history-heading" className="text-lg font-semibold">
                    Reading journal
                </h2>
                <span className="text-sm text-[#5B6B5D]">
                    {readings.total} entries
                </span>
            </div>
            {readings.data.length === 0 ? (
                <p className="mt-4 text-sm text-[#5B6B5D]">
                    Your journey starts with a chapter. Log a reading to keep
                    your reflections here.
                </p>
            ) : (
                <ul className="mt-4 divide-y divide-[#D9E3D3]">
                    {readings.data.map((entry) => (
                        <li key={entry.id} className="py-4">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <Link
                                        href={`/bible/${encodeURIComponent(entry.book)}/${entry.chapter}?translation=${encodeURIComponent(entry.translation)}`}
                                        className="font-medium text-[#2F6B3C] hover:underline"
                                    >
                                        {entry.book} {entry.chapter}
                                    </Link>
                                    <p className="mt-1 text-xs text-[#5B6B5D]">
                                        <time dateTime={entry.readOn}>
                                            {entry.readOn}
                                        </time>{' '}
                                        ? {entry.translation.toUpperCase()}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    disabled={deleting !== null}
                                    onClick={() => remove(entry.id)}
                                    aria-label={`Remove ${entry.book} ${entry.chapter} from ${entry.readOn}`}
                                    className="rounded px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
                                >
                                    {deleting === entry.id
                                        ? 'Removing...'
                                        : 'Remove'}
                                </button>
                            </div>
                            {entry.note && (
                                <p className="mt-3 text-sm leading-relaxed break-words whitespace-pre-wrap">
                                    {entry.note}
                                </p>
                            )}
                        </li>
                    ))}
                </ul>
            )}
            <nav
                aria-label="Reading journal pages"
                className="mt-4 flex justify-between text-sm text-[#2F6B3C]"
            >
                {readings.prev_page_url ? (
                    <Link href={readings.prev_page_url} preserveScroll>
                        Newer entries
                    </Link>
                ) : (
                    <span />
                )}
                {readings.next_page_url && (
                    <Link href={readings.next_page_url} preserveScroll>
                        Older entries
                    </Link>
                )}
            </nav>
        </section>
    );
}
