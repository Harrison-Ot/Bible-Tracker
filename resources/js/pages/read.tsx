import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    Check,
    Maximize2,
    Minimize2,
    Pause,
    Play,
    SlidersHorizontal,
    Square,
    Volume2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { store } from '@/actions/App/Http/Controllers/ReadingEntryController';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useReadingMode } from '@/hooks/use-reading-mode';
import {
    defaultReadingPreferences,
    useReadingPreferences,
    type ReadingPreferences,
} from '@/hooks/use-reading-preferences';
import type { Auth } from '@/types';

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
    chapterCount: number;
    translation: string;
    passage: { verses: Verse[] };
}

const readingWidths = {
    compact: 'max-w-xl',
    comfortable: 'max-w-3xl',
    wide: 'max-w-5xl',
};
const selectClass =
    'h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export default function Read({
    bookId,
    chapter,
    chapterCount,
    translation,
    passage,
}: ReadProps) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const { preferences, updatePreferences, saved } = useReadingPreferences(
        auth.user.id,
    );
    const { focused, setFocused } = useReadingMode();
    const bookName = passage.verses[0]?.book_name ?? bookId;
    const storageKey = `highlights:${bookId}:${chapter}`;
    const { post, transform, processing, recentlySuccessful, errors } = useForm(
        { book: bookName, chapter, translation },
    );
    const [highlighted, setHighlighted] = useState<Set<number>>(new Set());

    useEffect(() => {
        try {
            const value: unknown = JSON.parse(
                localStorage.getItem(storageKey) ?? '[]',
            );
            setHighlighted(
                new Set(
                    Array.isArray(value)
                        ? value.filter(
                              (verse) =>
                                  Number.isInteger(verse) &&
                                  passage.verses.some(
                                      (item) => item.verse === verse,
                                  ),
                          )
                        : [],
                ),
            );
        } catch {
            setHighlighted(new Set());
        }
    }, [storageKey, passage.verses]);

    const saveHighlights = (next: Set<number>) => {
        setHighlighted(next);
        try {
            localStorage.setItem(storageKey, JSON.stringify([...next]));
        } catch {
            /* Highlighting remains available for this session. */
        }
    };
    const toggleHighlight = (verse: number) => {
        const next = new Set(highlighted);
        if (next.has(verse)) next.delete(verse);
        else next.add(verse);
        saveHighlights(next);
    };

    useEffect(() => () => setFocused(false), [setFocused]);
    useEffect(() => {
        if (!focused) return;
        const escape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setFocused(false);
        };
        window.addEventListener('keydown', escape);
        return () => window.removeEventListener('keydown', escape);
    }, [focused, setFocused]);

    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [activeVerse, setActiveVerse] = useState<number | null>(null);
    const [speechError, setSpeechError] = useState('');
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const speechSupported =
        typeof window !== 'undefined' && 'speechSynthesis' in window;
    const fullText = useMemo(
        () => passage.verses.map((verse) => verse.text).join(' '),
        [passage.verses],
    );

    const stopSpeech = () => {
        if (speechSupported) window.speechSynthesis.cancel();
        utteranceRef.current = null;
        setIsSpeaking(false);
        setIsPaused(false);
        setActiveVerse(null);
    };
    const startSpeech = () => {
        if (!speechSupported || !fullText) return;
        window.speechSynthesis.cancel();
        setSpeechError('');
        let offset = 0;
        const boundaries = passage.verses.map((verse) => {
            const start = offset;
            offset += verse.text.length + 1;
            return { verse: verse.verse, start, end: offset };
        });
        const utterance = new SpeechSynthesisUtterance(fullText);
        utterance.rate = 0.95;
        utterance.onboundary = (event) => {
            const current = boundaries.find(
                (boundary) =>
                    event.charIndex >= boundary.start &&
                    event.charIndex < boundary.end,
            );
            if (current) setActiveVerse(current.verse);
        };
        utterance.onend = () => {
            setIsSpeaking(false);
            setIsPaused(false);
            setActiveVerse(null);
        };
        utterance.onerror = (event) => {
            setIsSpeaking(false);
            setIsPaused(false);
            setActiveVerse(null);
            if (!['canceled', 'interrupted'].includes(event.error))
                setSpeechError('Audio could not start. Please try again.');
        };
        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
        setIsPaused(false);
    };
    useEffect(() => {
        window.speechSynthesis?.cancel();
        setIsSpeaking(false);
        setIsPaused(false);
        setActiveVerse(null);
        setSpeechError('');
        return () => window.speechSynthesis?.cancel();
    }, [bookId, chapter, translation]);

    const markAsRead = () => {
        transform(() => ({ book: bookName, chapter, translation }));
        post(store.url(), { preserveScroll: true });
    };
    const passageUrl = (number: number) =>
        `/bible/${bookId}/${number}?translation=${encodeURIComponent(translation)}`;

    return (
        <>
            <Head title={`${bookName} ${chapter}`} />
            <div className="bg-background text-foreground flex min-h-[calc(100svh-4rem-var(--mobile-nav-height))] flex-col">
                <div
                    className={`mx-auto w-full flex-1 space-y-6 p-4 sm:p-8 ${readingWidths[preferences.width]}`}
                >
                    <header className="space-y-4 border-b pb-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <Link
                                href={`/bible/${bookId}?translation=${encodeURIComponent(translation)}`}
                                className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
                            >
                                <ArrowLeft
                                    className="size-4"
                                    aria-hidden="true"
                                />
                                {bookName} chapters
                            </Link>
                            <Button
                                variant="outline"
                                size="sm"
                                aria-pressed={focused}
                                onClick={() => setFocused(!focused)}
                            >
                                {focused ? (
                                    <Minimize2 aria-hidden="true" />
                                ) : (
                                    <Maximize2 aria-hidden="true" />
                                )}
                                {focused ? 'Exit focus' : 'Focus mode'}
                            </Button>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="text-primary mb-1 text-xs font-semibold tracking-widest uppercase">
                                    {translation.toUpperCase()}
                                </p>
                                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                    {bookName} {chapter}
                                </h1>
                            </div>
                            {speechSupported && (
                                <div className="flex flex-wrap gap-2">
                                    {!isSpeaking ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={startSpeech}
                                            disabled={!passage.verses.length}
                                        >
                                            <Volume2 aria-hidden="true" />
                                            Listen
                                        </Button>
                                    ) : (
                                        <>
                                            <Button
                                                size="sm"
                                                onClick={() => {
                                                    if (isPaused)
                                                        window.speechSynthesis.resume();
                                                    else
                                                        window.speechSynthesis.pause();
                                                    setIsPaused(!isPaused);
                                                }}
                                            >
                                                {isPaused ? (
                                                    <Play aria-hidden="true" />
                                                ) : (
                                                    <Pause aria-hidden="true" />
                                                )}
                                                {isPaused ? 'Resume' : 'Pause'}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={stopSpeech}
                                            >
                                                <Square aria-hidden="true" />
                                                Stop
                                            </Button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                        <p className="text-muted-foreground text-sm">
                            {passage.verses.length} verses · Select a verse to
                            highlight it.
                            {focused
                                ? ' Press Escape to leave focus mode.'
                                : ''}
                        </p>
                        {speechError && (
                            <p
                                role="alert"
                                className="text-destructive text-sm dark:text-red-400"
                            >
                                {speechError}
                            </p>
                        )}
                    </header>

                    <details className="bg-card rounded-xl border p-4 shadow-sm">
                        <summary className="focus-visible:ring-ring flex cursor-pointer list-none items-center gap-2 rounded-sm text-sm font-medium focus-visible:ring-2 focus-visible:outline-none">
                            <SlidersHorizontal
                                className="text-primary size-4"
                                aria-hidden="true"
                            />
                            Reading appearance
                            <span className="text-muted-foreground ml-auto text-xs font-normal">
                                {preferences.fontSize}px
                            </span>
                        </summary>
                        <div className="mt-5 grid gap-4 sm:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="reading-font-size">
                                    Text size
                                </Label>
                                <select
                                    id="reading-font-size"
                                    className={selectClass}
                                    value={preferences.fontSize}
                                    onChange={(event) =>
                                        updatePreferences({
                                            ...preferences,
                                            fontSize: Number(
                                                event.target.value,
                                            ),
                                        })
                                    }
                                >
                                    {[16, 18, 20, 22, 24, 26].map((size) => (
                                        <option key={size} value={size}>
                                            {size}px
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reading-line-spacing">
                                    Line spacing
                                </Label>
                                <select
                                    id="reading-line-spacing"
                                    className={selectClass}
                                    value={preferences.lineSpacing}
                                    onChange={(event) =>
                                        updatePreferences({
                                            ...preferences,
                                            lineSpacing: Number(
                                                event.target.value,
                                            ),
                                        })
                                    }
                                >
                                    <option value={1.6}>Close</option>
                                    <option value={1.8}>Comfortable</option>
                                    <option value={2}>Spacious</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reading-width">
                                    Reading width
                                </Label>
                                <select
                                    id="reading-width"
                                    className={selectClass}
                                    value={preferences.width}
                                    onChange={(event) =>
                                        updatePreferences({
                                            ...preferences,
                                            width: event.target
                                                .value as ReadingPreferences['width'],
                                        })
                                    }
                                >
                                    <option value="compact">Compact</option>
                                    <option value="comfortable">
                                        Comfortable
                                    </option>
                                    <option value="wide">Wide</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                            <p
                                role="status"
                                className="text-muted-foreground text-xs"
                            >
                                {saved
                                    ? 'Appearance is saved for your account on this device.'
                                    : 'Appearance changed for this session. Device storage is unavailable.'}
                            </p>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                    updatePreferences(defaultReadingPreferences)
                                }
                            >
                                Reset appearance
                            </Button>
                        </div>
                    </details>

                    {passage.verses.length ? (
                        <section
                            aria-label={`${bookName} ${chapter} passage`}
                            className="bg-card text-card-foreground space-y-1 rounded-xl border p-3 shadow-sm sm:p-6"
                            style={{
                                fontSize: preferences.fontSize,
                                lineHeight: preferences.lineSpacing,
                            }}
                        >
                            {passage.verses.map((verse) => (
                                <p
                                    key={verse.verse}
                                    role="button"
                                    tabIndex={0}
                                    aria-pressed={highlighted.has(verse.verse)}
                                    aria-label={`Verse ${verse.verse}: ${verse.text}`}
                                    onClick={() => toggleHighlight(verse.verse)}
                                    onKeyDown={(event) => {
                                        if (
                                            event.key === 'Enter' ||
                                            event.key === ' '
                                        ) {
                                            event.preventDefault();
                                            toggleHighlight(verse.verse);
                                        }
                                    }}
                                    className={`focus-visible:ring-ring cursor-pointer rounded-md px-2 py-1 transition-colors focus-visible:ring-2 focus-visible:outline-none ${highlighted.has(verse.verse) ? 'bg-amber-100 text-amber-950 dark:bg-amber-900/50 dark:text-amber-100' : 'hover:bg-accent'} ${activeVerse === verse.verse ? 'ring-primary/50 ring-2' : ''}`}
                                >
                                    <sup className="text-muted-foreground mr-2 text-xs font-semibold">
                                        {verse.verse}
                                    </sup>
                                    {verse.text}
                                </p>
                            ))}
                        </section>
                    ) : (
                        <section className="bg-card rounded-xl border p-8 text-center">
                            <h2 className="font-semibold">
                                No verses are available for this chapter.
                            </h2>
                            <p className="text-muted-foreground mt-2 text-sm">
                                Return to the book list to try another chapter
                                or translation.
                            </p>
                            <Button asChild variant="outline" className="mt-4">
                                <Link
                                    href={`/bible?translation=${encodeURIComponent(translation)}`}
                                >
                                    Browse the Bible
                                </Link>
                            </Button>
                        </section>
                    )}

                    {highlighted.size > 0 && (
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300/50 bg-amber-100/60 px-4 py-3 text-sm text-amber-950 dark:bg-amber-900/30 dark:text-amber-100">
                            <span>
                                {highlighted.size}{' '}
                                {highlighted.size === 1 ? 'verse' : 'verses'}{' '}
                                highlighted
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => saveHighlights(new Set())}
                            >
                                Clear highlights
                            </Button>
                        </div>
                    )}
                    <nav
                        aria-label="Chapter navigation"
                        className="flex flex-wrap justify-between gap-3 pb-4"
                    >
                        {chapter > 1 ? (
                            <Button asChild variant="outline">
                                <Link href={passageUrl(chapter - 1)}>
                                    <ArrowLeft aria-hidden="true" />
                                    Chapter {chapter - 1}
                                </Link>
                            </Button>
                        ) : (
                            <span />
                        )}
                        {chapter < chapterCount ? (
                            <Button asChild variant="outline">
                                <Link href={passageUrl(chapter + 1)}>
                                    Chapter {chapter + 1}
                                    <ArrowRight aria-hidden="true" />
                                </Link>
                            </Button>
                        ) : (
                            <span className="text-muted-foreground self-center text-sm">
                                End of {bookName}
                            </span>
                        )}
                    </nav>
                </div>
                <div
                    className={`bg-background/95 sticky bottom-[var(--mobile-nav-height)] z-20 border-t p-4 backdrop-blur-md ${focused ? 'pb-[max(1rem,env(safe-area-inset-bottom))]' : ''}`}
                >
                    <div
                        className={`mx-auto flex w-full flex-wrap items-center justify-between gap-3 ${readingWidths[preferences.width]}`}
                    >
                        {focused ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setFocused(false)}
                            >
                                <Minimize2 aria-hidden="true" />
                                Exit focus
                            </Button>
                        ) : (
                            <p className="text-muted-foreground text-xs">
                                {bookName} {chapter} ·{' '}
                                {translation.toUpperCase()}
                            </p>
                        )}
                        <Button
                            onClick={markAsRead}
                            disabled={processing || !passage.verses.length}
                        >
                            {recentlySuccessful && <Check aria-hidden="true" />}
                            {processing
                                ? 'Saving...'
                                : recentlySuccessful
                                  ? 'Marked as read'
                                  : 'Mark as read'}
                        </Button>
                    </div>
                    {Object.values(errors).length > 0 && (
                        <p
                            role="alert"
                            className="text-destructive mx-auto mt-2 max-w-prose text-sm"
                        >
                            {Object.values(errors).join(' ')}
                        </p>
                    )}
                </div>
            </div>
        </>
    );
}
