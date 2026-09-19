import { useEffect, useState } from 'react';

interface DailyVerseData {
    reference: string;
    text: string;
    translation: string;
}

// Fallback pool used only if the backend request fails —
// keeps the dashboard from showing an empty/broken card.
const FALLBACK_VERSES: DailyVerseData[] = [
    { reference: 'Psalm 46:1', text: 'God is our refuge and strength, a very present help in trouble.', translation: 'KJV' },
    { reference: 'Proverbs 3:5', text: 'Trust in the Lord with all thine heart; and lean not unto thine own understanding.', translation: 'KJV' },
    { reference: 'Philippians 4:13', text: 'I can do all things through Christ who strengtheneth me.', translation: 'KJV' },
];

export default function DailyVerse() {
    const [verse, setVerse] = useState<DailyVerseData | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        let cancelled = false;

        fetch('/api/bible')
            .then((res) => {
                if (!res.ok) throw new Error('Request failed');
                return res.json();
            })
            .then((data: DailyVerseData) => {
                if (!cancelled) setVerse(data);
            })
            .catch(() => {
                if (!cancelled) {
                    const fallback = FALLBACK_VERSES[Math.floor(Math.random() * FALLBACK_VERSES.length)];
                    setVerse(fallback);
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const copyVerse = () => {
        if (!verse) return;
        navigator.clipboard.writeText(`"${verse.text}" — ${verse.reference}`).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        });
    };

    return (
        <div className="rounded-xl border border-[#D9E3D3] bg-gradient-to-br from-[#2F6B3C] to-[#1F4D28] p-6 text-white shadow-sm">
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-white/70">
                    Verse of the day
                </span>
                {verse && (
                    <button
                        onClick={copyVerse}
                        className="rounded-full border border-white/30 px-3 py-1 text-xs font-medium text-white/90 hover:bg-white/10"
                    >
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                )}
            </div>

            <div className="mt-4 min-h-[72px]">
                {loading ? (
                    <div className="space-y-2">
                        <div className="h-3 w-full animate-pulse rounded bg-white/20" />
                        <div className="h-3 w-5/6 animate-pulse rounded bg-white/20" />
                        <div className="h-3 w-2/3 animate-pulse rounded bg-white/20" />
                    </div>
                ) : (
                    <p className="text-lg leading-relaxed">{verse?.text}</p>
                )}
            </div>

            {!loading && verse && (
                <p className="mt-4 text-sm font-medium text-white/80">
                    {verse.reference} · {verse.translation}
                </p>
            )}
        </div>
    );
}