import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

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
    const storageKey = `highlights:${bookId}:${chapter}`;

    const { post, processing, recentlySuccessful } = useForm({
        book: bookName,
        chapter,
        translation,
    });

    // ---- Highlighting ----
    const [highlighted, setHighlighted] = useState<Set<number>>(new Set());

    useEffect(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            setHighlighted(saved ? new Set(JSON.parse(saved)) : new Set());
        } catch {
            setHighlighted(new Set());
        }
    }, [storageKey]);

    const toggleHighlight = (verse: number) => {
        setHighlighted((prev) => {
            const next = new Set(prev);
            next.has(verse) ? next.delete(verse) : next.add(verse);
            try {
                localStorage.setItem(storageKey, JSON.stringify([...next]));
            } catch {
                // storage unavailable — highlight still works for this session
            }
            return next;
        });
    };

    // ---- Text-to-speech ----
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [activeVerse, setActiveVerse] = useState<number | null>(null);
    const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

    const fullText = useMemo(
        () => passage.verses.map((v) => v.text).join(' '),
        [passage.verses]
    );

    const startSpeech = () => {
        if (!speechSupported) return;
        window.speechSynthesis.cancel();

        let charOffset = 0;
        const boundaries = passage.verses.map((v) => {
            const start = charOffset;
            charOffset += v.text.length + 1;
            return { verse: v.verse, start, end: charOffset };
        });

        const utterance = new SpeechSynthesisUtterance(fullText);
        utterance.rate = 0.95;

        utterance.onboundary = (e) => {
            const hit = boundaries.find((b) => e.charIndex >= b.start && e.charIndex < b.end);
            if (hit) setActiveVerse(hit.verse);
        };
        utterance.onend = () => {
            setIsSpeaking(false);
            setIsPaused(false);
            setActiveVerse(null);
        };
        utterance.onerror = () => {
            setIsSpeaking(false);
            setIsPaused(false);
            setActiveVerse(null);
        };

        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
        setIsPaused(false);
    };

    const pauseSpeech = () => {
        window.speechSynthesis.pause();
        setIsPaused(true);
    };

    const resumeSpeech = () => {
        window.speechSynthesis.resume();
        setIsPaused(false);
    };

    const stopSpeech = () => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        setIsPaused(false);
        setActiveVerse(null);
    };

    useEffect(() => stopSpeech, [bookId, chapter]);

    // ---- Mark as read ----
    const markAsRead = () => {
        post('/reading-entries', {
            preserveScroll: true,
            onSuccess: () => {
                // Refreshes shared Inertia props (e.g. streak/progress used on
                // the dashboard) without a full page navigation.
                // Requires those values to be registered in
                // HandleInertiaRequests::share() on the backend.
            },
        });
    };

    const prevChapter = chapter > 1 ? chapter - 1 : null;
    const nextChapter = chapter + 1;

    return (
        <>
            <Head title={`${bookName} ${chapter}`} />
            <div className="min-h-screen bg-[#F7FAF6] pb-28">
                <div className="mx-auto max-w-2xl space-y-6 p-6 sm:p-10">
                    {/* Header */}
                    <div className="border-b border-[#D9E3D3] pb-5">
                        <Link
                            href={`/bible/${bookId}`}
                            className="inline-flex items-center gap-1 text-sm font-medium text-[#2F6B3C] hover:text-[#153D1D]"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                            {bookName} chapters
                        </Link>

                        <div className="mt-3 flex items-center justify-between">
                            <h1 className="text-3xl font-bold tracking-tight text-[#16241A]">
                                {bookName} {chapter}
                            </h1>

                            {speechSupported && (
                                <div className="flex items-center gap-2">
                                    {!isSpeaking && (
                                        <button
                                            onClick={startSpeech}
                                            className="flex items-center gap-1.5 rounded-full border border-[#D9E3D3] bg-white px-3.5 py-2 text-xs font-medium text-[#2F6B3C] shadow-sm hover:border-[#2F6B3C] hover:bg-[#2F6B3C]/5"
                                        >
                                            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.383 3.076a1 1 0 011.617.808v12.232a1 1 0 01-1.617.808L4.99 13.2H3a1 1 0 01-1-1V7.8a1 1 0 011-1h1.99l4.393-3.724z" />
                                                <path d="M14.657 5.343a1 1 0 011.414 0A7.975 7.975 0 0118 10a7.975 7.975 0 01-1.93 4.657 1 1 0 11-1.414-1.414A5.975 5.975 0 0016 10a5.975 5.975 0 00-1.343-3.243 1 1 0 010-1.414z" />
                                            </svg>
                                            Listen
                                        </button>
                                    )}
                                    {isSpeaking && (
                                        <>
                                            <button
                                                onClick={isPaused ? resumeSpeech : pauseSpeech}
                                                className="flex items-center gap-1.5 rounded-full bg-[#2F6B3C] px-3.5 py-2 text-xs font-medium text-white shadow-sm hover:bg-[#153D1D]"
                                            >
                                                {isPaused ? 'Resume' : 'Pause'}
                                            </button>
                                            <button
                                                onClick={stopSpeech}
                                                className="rounded-full border border-[#D9E3D3] bg-white px-3.5 py-2 text-xs font-medium text-[#5B6B5D] shadow-sm hover:border-red-300 hover:text-red-600"
                                            >
                                                Stop
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        <p className="mt-1 text-sm text-[#5B6B5D]">
                            {translation.toUpperCase()} · {passage.verses.length} verses · tap a verse to highlight it
                        </p>
                    </div>

                    {/* Passage */}
                    <div className="space-y-1 rounded-xl border border-[#D9E3D3] bg-white p-6 leading-relaxed text-[#16241A] shadow-sm sm:p-8">
                        {passage.verses.map((v) => {
                            const isHighlighted = highlighted.has(v.verse);
                            const isSpeakingNow = activeVerse === v.verse;
                            return (
                                <p
                                    key={v.verse}
                                    onClick={() => toggleHighlight(v.verse)}
                                    className={`cursor-pointer rounded-md px-2 py-1 transition-colors ${
                                        isHighlighted ? 'bg-[#F5E7A8]' : 'hover:bg-[#2F6B3C]/5'
                                    } ${isSpeakingNow ? 'ring-2 ring-[#2F6B3C]/40' : ''}`}
                                >
                                    <sup className="mr-1 text-xs font-medium text-[#8FA491]">{v.verse}</sup>
                                    {v.text}
                                </p>
                            );
                        })}
                    </div>

                    {highlighted.size > 0 && (
                        <div className="flex items-center justify-between rounded-lg border border-[#F0E0A0] bg-[#FBF6E3] px-4 py-2.5 text-sm text-[#7A6A2A]">
                            <span>
                                {highlighted.size} verse{highlighted.size > 1 ? 's' : ''} highlighted
                            </span>
                            <button
                                onClick={() => {
                                    setHighlighted(new Set());
                                    localStorage.removeItem(storageKey);
                                }}
                                className="font-medium underline hover:text-[#5A4E1E]"
                            >
                                Clear
                            </button>
                        </div>
                    )}

                    {/* Chapter navigation */}
                    <div className="flex justify-between text-sm">
                        {prevChapter ? (
                            <Link
                                href={`/bible/${bookId}/${prevChapter}`}
                                className="flex items-center gap-1 font-medium text-[#2F6B3C] hover:text-[#153D1D]"
                            >
                                ← Chapter {prevChapter}
                            </Link>
                        ) : (
                            <span />
                        )}
                        <Link
                            href={`/bible/${bookId}/${nextChapter}`}
                            className="flex items-center gap-1 font-medium text-[#2F6B3C] hover:text-[#153D1D]"
                        >
                            Chapter {nextChapter} →
                        </Link>
                    </div>
                </div>

                {/* Sticky bottom action bar */}
                <div className="fixed inset-x-0 bottom-0 border-t border-[#D9E3D3] bg-white/90 p-4 backdrop-blur-sm">
                    <div className="mx-auto flex max-w-2xl items-center justify-between">
                        <p className="text-xs text-[#5B6B5D]">
                            {bookName} {chapter} · {translation.toUpperCase()}
                        </p>
                        <button
                            onClick={markAsRead}
                            disabled={processing}
                            className={`flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50 ${
                                recentlySuccessful ? 'bg-[#153D1D]' : 'bg-[#2F6B3C] hover:bg-[#153D1D]'
                            }`}
                        >
                            {processing ? (
                                'Saving…'
                            ) : recentlySuccessful ? (
                                <>
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                    Marked as read
                                </>
                            ) : (
                                'Mark as read'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}