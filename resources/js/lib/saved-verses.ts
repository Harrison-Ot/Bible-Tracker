export interface SavedVerse {
    id: number;
    bookId: string;
    book: string;
    chapter: number;
    verse: number;
    translation: string;
    text: string;
    highlighted: boolean;
    bookmarked: boolean;
    url: string;
}

export async function savedVerseRequest<T>(
    url: string,
    method: 'PUT' | 'POST' | 'DELETE',
    body?: unknown,
    signal?: AbortSignal,
): Promise<T> {
    const cookie = document.cookie
        .split('; ')
        .find((value) => value.startsWith('XSRF-TOKEN='));
    const token = cookie
        ? decodeURIComponent(cookie.slice('XSRF-TOKEN='.length))
        : '';
    let response: Response;
    try {
        response = await fetch(url, {
            method,
            credentials: 'same-origin',
            signal,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...(token ? { 'X-XSRF-TOKEN': token } : {}),
            },
            body: body === undefined ? undefined : JSON.stringify(body),
        });
    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError')
            throw error;
        throw new Error(
            'Could not confirm this change. Check your connection and try again.',
        );
    }
    const payload = response.headers
        .get('content-type')
        ?.includes('application/json')
        ? await response.json()
        : null;
    if (!response.ok || payload === null) {
        if ([401, 419].includes(response.status))
            throw new Error(
                'Your session expired. Sign in again before saving verses.',
            );
        if (response.status === 429)
            throw new Error(
                'Too many saves at once. Wait a minute and try again.',
            );
        const messages = payload?.errors
            ? Object.values(payload.errors).flat().join(' ')
            : '';
        throw new Error(
            messages || 'Could not save this change. Please try again.',
        );
    }
    return payload as T;
}

export interface DeviceHighlightChapter {
    bookId: string;
    chapter: number;
    verses: number[];
}

export function deviceHighlights(): DeviceHighlightChapter[] {
    const chapters: DeviceHighlightChapter[] = [];
    try {
        for (let index = 0; index < localStorage.length; index++) {
            const key = localStorage.key(index);
            const match = key?.match(/^highlights:([1-3]?[A-Z]{2,3}):(\d+)$/);
            if (!key || !match) continue;
            try {
                const value: unknown = JSON.parse(
                    localStorage.getItem(key) ?? 'null',
                );
                const verses = Array.isArray(value)
                    ? [
                          ...new Set(
                              value.filter(
                                  (verse): verse is number =>
                                      typeof verse === 'number' &&
                                      Number.isInteger(verse) &&
                                      verse > 0 &&
                                      verse <= 200,
                              ),
                          ),
                      ]
                    : [];
                const chapter = Number(match[2]);
                if (verses.length && chapter > 0 && chapter <= 150)
                    chapters.push({ bookId: match[1], chapter, verses });
            } catch {
                /* A damaged chapter does not block other imports. */
            }
        }
    } catch {
        /* Device storage is optional; account saves still work. */
    }
    return chapters;
}
