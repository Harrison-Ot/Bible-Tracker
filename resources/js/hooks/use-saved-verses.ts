import { useEffect, useMemo, useRef, useState } from 'react';
import { savedVerseRequest, type SavedVerse } from '@/lib/saved-verses';

export function useSavedVerses(
    initial: SavedVerse[],
    bookId: string,
    chapter: number,
    translation: string,
) {
    const [verses, setVerses] = useState(initial);
    const [pending, setPending] = useState(false);
    const [feedback, setFeedback] = useState<{
        error: boolean;
        message: string;
    } | null>(null);
    const locked = useRef(false);
    const request = useRef<AbortController | null>(null);
    const key = `${bookId}:${chapter}:${translation}`;
    const currentKey = useRef(key);
    currentKey.current = key;

    useEffect(() => {
        request.current?.abort();
        locked.current = false;
        setPending(false);
        setFeedback(null);
        setVerses(initial);
        return () => request.current?.abort();
    }, [initial, key]);

    const perform = async (
        action: () => Promise<SavedVerse[]>,
        message: string,
    ) => {
        if (locked.current) return;
        locked.current = true;
        setPending(true);
        setFeedback(null);
        const controller = new AbortController();
        request.current = controller;
        try {
            const result = await action();
            if (!controller.signal.aborted && currentKey.current === key) {
                setVerses(result);
                setFeedback({ error: false, message });
            }
        } catch (error) {
            if (!controller.signal.aborted && currentKey.current === key)
                setFeedback({
                    error: true,
                    message:
                        error instanceof Error
                            ? error.message
                            : 'Could not save this change. Please try again.',
                });
        } finally {
            if (!controller.signal.aborted && currentKey.current === key) {
                locked.current = false;
                setPending(false);
            }
        }
    };
    const save = (
        verse: number,
        flags: { highlighted?: boolean; bookmarked?: boolean },
    ) =>
        perform(async () => {
            const response = await savedVerseRequest<{
                savedVerse: SavedVerse | null;
            }>(
                '/saved-verses',
                'PUT',
                { book_id: bookId, chapter, verse, translation, ...flags },
                request.current?.signal,
            );
            return [
                ...verses.filter((entry) => entry.verse !== verse),
                ...(response.savedVerse ? [response.savedVerse] : []),
            ];
        }, 'Saved verses updated in your account.');
    const clearHighlights = () =>
        perform(async () => {
            const response = await savedVerseRequest<{
                savedVerses: SavedVerse[];
            }>(
                '/saved-verses/highlights',
                'DELETE',
                { book_id: bookId, chapter, translation },
                request.current?.signal,
            );
            return response.savedVerses;
        }, 'Highlights cleared for this chapter. Your bookmarks are kept.');

    const highlighted = useMemo(
        () =>
            new Set(
                verses
                    .filter((verse) => verse.highlighted)
                    .map((verse) => verse.verse),
            ),
        [verses],
    );
    const bookmarked = useMemo(
        () =>
            new Set(
                verses
                    .filter((verse) => verse.bookmarked)
                    .map((verse) => verse.verse),
            ),
        [verses],
    );
    return {
        highlighted,
        bookmarked,
        pending,
        feedback,
        save,
        clearHighlights,
    };
}
