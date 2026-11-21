import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    Check,
    Bookmark,
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
import { useSavedVerses } from '@/hooks/use-saved-verses';
import { deviceHighlights, type SavedVerse } from '@/lib/saved-verses';
import ActionFeedback from '@/components/action-feedback';
import DownloadChapter from '@/components/download-chapter';
import ReadingMusic, { type ReadingSong } from '@/components/reading-music';
import { localToday, loggingOwner, queueReading } from '@/lib/offline-db';

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
    savedVerses: SavedVerse[];
    today?: string;
    songs?: ReadingSong[];
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
    savedVerses,
    today,
    songs = [],
}: ReadProps) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const { preferences, updatePreferences, saved } = useReadingPreferences(
        auth.user.id,
    );
    const { focused, setFocused } = useReadingMode();
    const bookName = passage.verses[0]?.book_name ?? bookId;
    const { post, transform, processing, recentlySuccessful, errors } = useForm(
        { book: bookName, chapter, translation },
    );
    const {
        highlighted,
        bookmarked,
        pending: savedPending,
        feedback: savedFeedback,
        save,
        clearHighlights,
    } = useSavedVerses(savedVerses, bookId, chapter, translation);
    const [legacyVerses, setLegacyVerses] = useState<number[]>([]);
    useEffect(() => {
        setLegacyVerses(
            deviceHighlights().find(
                (entry) => entry.bookId === bookId && entry.chapter === chapter,
            )?.verses ?? [],
        );
    }, [bookId, chapter]);
    const legacyCount = legacyVerses.filter(
        (verse) =>
            !highlighted.has(verse) &&
            passage.verses.some((item) => item.verse === verse),
    ).length;
    const toggleHighlight = (verse: number) =>
        save(verse, { highlighted: !highlighted.has(verse) });
    useEffect(() => () => setFocused(false), [setFocused]);
    useEffect(() => {
        if (!focused) return;
        const escape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setFocused(false);
        };
        window.addEventListener('keydown', escape);
        return () => window.removeEventListener('keydown', escape);
    }, [focused, setFocused]);

    const musicRef = useRef<HTMLAudioElement | null>(null);
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
        utteranceRef.current = null;
        if (speechSupported) window.speechSynthesis.cancel();
        setIsSpeaking(false);
        setIsPaused(false);
        setActiveVerse(null);
    };
    const startSpeech = () => {
        if (!speechSupported || !fullText) return;
        musicRef.current?.pause();
        utteranceRef.current = null;
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
            if (utteranceRef.current !== utterance) return;
            const current = boundaries.find(
                (boundary) =>
                    event.charIndex >= boundary.start &&
                    event.charIndex < boundary.end,
            );
            if (current) setActiveVerse(current.verse);
        };
        utterance.onend = () => {
            if (utteranceRef.current !== utterance) return;
            utteranceRef.current = null;
            setIsSpeaking(false);
            setIsPaused(false);
            setActiveVerse(null);
        };
        utterance.onerror = (event) => {
            if (utteranceRef.current !== utterance) return;
            utteranceRef.current = null;
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
        utteranceRef.current = null;
        window.speechSynthesis?.cancel();
        setIsSpeaking(false);
        setIsPaused(false);
        setActiveVerse(null);
        setSpeechError('');
        return () => {
            utteranceRef.current = null;
            window.speechSynthesis?.cancel();
        };
    }, [bookId, chapter, translation]);

    const [offlineBusy, setOfflineBusy] = useState(false);
    const [offlineFeedback, setOfflineFeedback] = useState<{
        error: boolean;
        message: string;
    } | null>(null);
    const offlineLock = useRef(false);
    const queueCurrent = async (date: string) => {
        if (offlineLock.current) return;
        offlineLock.current = true;
        setOfflineBusy(true);
        setOfflineFeedback(null);
        try {
            if (translation !== 'web')
                throw new Error(
                    'Offline reading logs support WEB. Reconnect to save this translation.',
                );
            if ((await loggingOwner()) !== auth.user.id)
                throw new Error(
                    'Enable offline reading logs on the Downloads page while signed in before going offline.',
                );
            await queueReading(auth.user.id, { bookId, chapter }, date);
            setOfflineFeedback({
                error: false,
                message: `Reading queued for ${date} on this device. Your journal and streak update after sync is confirmed.`,
            });
        } catch (failure) {
            setOfflineFeedback({
                error: true,
                message:
                    failure instanceof Error
                        ? failure.message
                        : 'Could not queue this reading. It has not been saved.',
            });
        } finally {
            offlineLock.current = false;
            setOfflineBusy(false);
        }
    };
    const markAsRead = () => {
        const date = navigator.onLine ? (today ?? localToday()) : localToday();
        if (!navigator.onLine) {
            void queueCurrent(date);
            return;
        }
        setOfflineFeedback(null);
        transform(() => ({
            book: bookName,
            chapter,
            translation,
            read_on: date,
        }));
        post(store.url(), {
            preserveScroll: true,
            onNetworkError: () => {
                void queueCurrent(date);
                return false;
            },
            onHttpException: () => {
                setOfflineFeedback({
                    error: true,
                    message:
                        'Could not save this reading. Refresh your session and try again.',
                });
                return false;
            },
        });
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
                                            Listen to chapter
                                        </Button>
                                    ) : (
                                        <>
                                            <Button
                                                size="sm"
                                                onClick={() => {
                                                    if (isPaused) {
                                                        musicRef.current?.pause();
                                                        window.speechSynthesis.resume();
                                                    } else
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
                            highlight it, or use its bookmark button.
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
                    <ReadingMusic
                        songs={songs}
                        audioRef={musicRef}
                        onPlay={stopSpeech}
                    />
                    <DownloadChapter
                        bookId={bookId}
                        chapter={chapter}
                        translation={translation}
                    />

                    <ActionFeedback feedback={savedFeedback} />
                    {legacyCount > 0 && (
                        <div className="border-primary/20 bg-primary/5 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
                            <p className="text-muted-foreground text-sm">
                                {legacyCount} device{' '}
                                {legacyCount === 1
                                    ? 'highlight is'
                                    : 'highlights are'}{' '}
                                ready to import into your account.
                            </p>
                            <Button asChild variant="outline" size="sm">
                                <Link href="/saved-verses">
                                    Import device highlights
                                </Link>
                            </Button>
                        </div>
                    )}
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
                            aria-busy={savedPending}
                            className="bg-card text-card-foreground space-y-2 rounded-xl border p-3 shadow-sm sm:p-6"
                            style={{
                                fontSize: preferences.fontSize,
                                lineHeight: preferences.lineSpacing,
                            }}
                        >
                            {passage.verses.map((verse) => (
                                <div
                                    key={verse.verse}
                                    className="flex items-start gap-1"
                                >
                                    <p
                                        id={`verse-${verse.verse}`}
                                        role="button"
                                        tabIndex={0}
                                        aria-disabled={savedPending}
                                        aria-pressed={highlighted.has(
                                            verse.verse,
                                        )}
                                        aria-label={`Highlight verse ${verse.verse}: ${verse.text}`}
                                        onClick={() =>
                                            toggleHighlight(verse.verse)
                                        }
                                        onKeyDown={(event) => {
                                            if (
                                                event.key === 'Enter' ||
                                                event.key === ' '
                                            ) {
                                                event.preventDefault();
                                                void toggleHighlight(
                                                    verse.verse,
                                                );
                                            }
                                        }}
                                        className={`focus-visible:ring-ring min-w-0 flex-1 cursor-pointer rounded-md px-2 py-1 transition-colors focus-visible:ring-2 focus-visible:outline-none ${highlighted.has(verse.verse) ? 'bg-amber-100 text-amber-950 dark:bg-amber-900/50 dark:text-amber-100' : 'hover:bg-accent'} ${activeVerse === verse.verse ? 'ring-primary/50 ring-2' : ''}`}
                                    >
                                        <sup className="text-muted-foreground mr-2 text-xs font-semibold">
                                            {verse.verse}
                                        </sup>
                                        {verse.text}
                                    </p>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        disabled={savedPending}
                                        aria-pressed={bookmarked.has(
                                            verse.verse,
                                        )}
                                        aria-label={`${bookmarked.has(verse.verse) ? 'Remove bookmark for' : 'Bookmark'} ${bookName} ${chapter}:${verse.verse}`}
                                        onClick={() =>
                                            save(verse.verse, {
                                                bookmarked: !bookmarked.has(
                                                    verse.verse,
                                                ),
                                            })
                                        }
                                        className="text-primary mt-1 shrink-0"
                                    >
                                        <Bookmark
                                            className={
                                                bookmarked.has(verse.verse)
                                                    ? 'fill-current'
                                                    : ''
                                            }
                                            aria-hidden="true"
                                        />
                                    </Button>
                                </div>
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
                                highlighted · Saved to your account
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={savedPending}
                                onClick={clearHighlights}
                            >
                                Clear highlights
                            </Button>
                        </div>
                    )}
                    <div className="flex justify-end">
                        <Button asChild variant="ghost" size="sm">
                            <Link href="/saved-verses">
                                <Bookmark aria-hidden="true" />
                                View saved verses
                            </Link>
                        </Button>
                    </div>
                    <nav
                        aria-label="Chapter navigation"
                        className="flex flex-wrap justify-between gap-3 pb-4"
                    >
                        {chapter > 1 ? (
                            <Button asChild variant="outline">
                                <Link
                                    href={passageUrl(chapter - 1)}
                                    preserveState
                                >
                                    <ArrowLeft aria-hidden="true" />
                                    Chapter {chapter - 1}
                                </Link>
                            </Button>
                        ) : (
                            <span />
                        )}
                        {chapter < chapterCount ? (
                            <Button asChild variant="outline">
                                <Link
                                    href={passageUrl(chapter + 1)}
                                    preserveState
                                >
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
                            disabled={
                                processing ||
                                offlineBusy ||
                                !passage.verses.length
                            }
                        >
                            {recentlySuccessful && <Check aria-hidden="true" />}
                            {processing || offlineBusy
                                ? 'Saving...'
                                : recentlySuccessful
                                  ? 'Marked as read'
                                  : 'Mark as read'}
                        </Button>
                    </div>
                    {offlineFeedback && (
                        <p
                            role={offlineFeedback.error ? 'alert' : 'status'}
                            className={`mx-auto mt-2 max-w-prose text-sm ${offlineFeedback.error ? 'text-destructive' : 'text-primary'}`}
                        >
                            {offlineFeedback.message}
                        </p>
                    )}
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
