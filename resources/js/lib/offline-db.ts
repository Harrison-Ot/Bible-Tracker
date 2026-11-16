export const DOWNLOAD_LIMIT = 50;
export const DOWNLOAD_BYTES = 10 * 1024 * 1024;
export const QUEUE_LIMIT = 200;
export type OfflineChapter = {
    bookId: string;
    bookName: string;
    chapter: number;
    translation: 'web';
    verses: { verse: number; text: string }[];
    downloadedAt: string;
    license: 'Public Domain';
    licenseUrl: string;
};
export type OfflineReading = {
    client_id: string;
    owner_id: number;
    book_id: string;
    chapter: number;
    translation: 'web';
    read_on: string;
    error: string | null;
};
const DB_NAME = 'bible-tracker-offline';
const CHANGE = 'bible-tracker-offline-change';
const CHANNEL = 'bible-tracker-offline';
export const chapterKey = (bookId: string, chapter: number) =>
    `web:${bookId}:${chapter}`;
export const localToday = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};
const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;
export function isOfflineChapter(value: unknown): value is OfflineChapter {
    if (
        !isObject(value) ||
        value.translation !== 'web' ||
        value.license !== 'Public Domain' ||
        value.licenseUrl !== 'https://www.ebible.org/eng-web/copyright.htm' ||
        typeof value.bookId !== 'string' ||
        !/^(?:[1-3])?[A-Z]{2,3}$/.test(value.bookId) ||
        typeof value.bookName !== 'string' ||
        value.bookName.length > 50 ||
        !Number.isInteger(value.chapter) ||
        Number(value.chapter) < 1 ||
        Number(value.chapter) > 150 ||
        typeof value.downloadedAt !== 'string' ||
        !Number.isFinite(Date.parse(value.downloadedAt)) ||
        !Array.isArray(value.verses) ||
        value.verses.length < 1 ||
        value.verses.length > 200
    )
        return false;
    return value.verses.every(
        (verse: unknown, index: number) =>
            isObject(verse) &&
            verse.verse === index + 1 &&
            typeof verse.text === 'string' &&
            verse.text.trim().length > 0 &&
            verse.text.length <= 20000,
    );
}
function isReading(value: unknown): value is OfflineReading {
    return (
        isObject(value) &&
        typeof value.client_id === 'string' &&
        /^[a-f0-9-]{36}$/i.test(value.client_id) &&
        Number.isInteger(value.owner_id) &&
        Number(value.owner_id) > 0 &&
        typeof value.book_id === 'string' &&
        /^(?:[1-3])?[A-Z]{2,3}$/.test(value.book_id) &&
        Number.isInteger(value.chapter) &&
        Number(value.chapter) >= 1 &&
        Number(value.chapter) <= 150 &&
        value.translation === 'web' &&
        typeof value.read_on === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(value.read_on) &&
        (value.error === null || typeof value.error === 'string')
    );
}
export const chapterBytes = (chapter: unknown) =>
    new TextEncoder().encode(JSON.stringify(chapter)).byteLength;
function notify() {
    window.dispatchEvent(new Event(CHANGE));
    try {
        const channel = new BroadcastChannel(CHANNEL);
        channel.postMessage('changed');
        channel.close();
    } catch {
        /* Focus refresh still works without BroadcastChannel. */
    }
}
export function observeOffline(callback: () => void) {
    window.addEventListener(CHANGE, callback);
    window.addEventListener('focus', callback);
    let channel: BroadcastChannel | undefined;
    try {
        channel = new BroadcastChannel(CHANNEL);
        channel.onmessage = callback;
    } catch {
        /* Same-tab notifications and focus refresh remain available. */
    }
    return () => {
        window.removeEventListener(CHANGE, callback);
        window.removeEventListener('focus', callback);
        channel?.close();
    };
}
async function database(): Promise<IDBDatabase> {
    if (typeof indexedDB === 'undefined')
        throw new Error('This browser does not support offline storage.');
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        let blocked = false;
        request.onupgradeneeded = () => {
            const db = request.result;
            db.createObjectStore('chapters', { keyPath: 'key' });
            const queue = db.createObjectStore('queue', {
                keyPath: 'client_id',
            });
            queue.createIndex('owner', 'owner_id');
            db.createObjectStore('meta', { keyPath: 'key' });
        };
        request.onblocked = () => {
            blocked = true;
            reject(
                new Error('Close other Bible Tracker tabs, then try again.'),
            );
        };
        request.onerror = () =>
            reject(
                new Error(
                    'Offline storage is unavailable. Check browser storage permissions and free space.',
                ),
            );
        request.onsuccess = () => {
            if (blocked) request.result.close();
            else resolve(request.result);
        };
    });
}
async function transaction<T>(
    names: string[],
    mode: IDBTransactionMode,
    work: (
        tx: IDBTransaction,
        result: (value: T) => void,
        fail: (message: string) => void,
    ) => void,
    changed = false,
): Promise<T> {
    const db = await database();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(names, mode);
        let value: T;
        let failure: Error | undefined;
        tx.oncomplete = () => {
            db.close();
            if (changed) notify();
            resolve(value);
        };
        tx.onabort = () => {
            db.close();
            reject(
                failure ??
                    new Error(
                        'Could not save offline data. Check storage permissions and free space, then try again.',
                    ),
            );
        };
        try {
            work(
                tx,
                (result) => {
                    value = result;
                },
                (message) => {
                    failure = new Error(message);
                    tx.abort();
                },
            );
        } catch (error) {
            failure =
                error instanceof Error
                    ? error
                    : new Error('Offline storage failed.');
            tx.abort();
        }
    });
}
export function downloadedChapters() {
    return transaction<OfflineChapter[]>(
        ['chapters'],
        'readonly',
        (tx, result) => {
            const request = tx.objectStore('chapters').getAll();
            request.onsuccess = () =>
                result(
                    (request.result as unknown[])
                        .filter(isOfflineChapter)
                        .sort(
                            (a, b) =>
                                a.bookName.localeCompare(b.bookName) ||
                                a.chapter - b.chapter,
                        ),
                );
        },
    );
}
export async function saveChapter(chapter: OfflineChapter) {
    if (!isOfflineChapter(chapter) || chapterBytes(chapter) > 262144)
        throw new Error(
            'This chapter could not be verified. Download it again while online.',
        );
    // Store only public passage text and licensing metadata, never account/page props.
    const clean: OfflineChapter = {
        bookId: chapter.bookId,
        bookName: chapter.bookName,
        chapter: chapter.chapter,
        translation: 'web',
        verses: chapter.verses.map((verse) => ({
            verse: verse.verse,
            text: verse.text,
        })),
        downloadedAt: chapter.downloadedAt,
        license: 'Public Domain',
        licenseUrl: chapter.licenseUrl,
    };
    return transaction<void>(
        ['chapters'],
        'readwrite',
        (tx, _result, fail) => {
            const store = tx.objectStore('chapters');
            const request = store.getAll();
            request.onsuccess = () => {
                try {
                    const key = chapterKey(clean.bookId, clean.chapter);
                    const others = (request.result as { key: string }[]).filter(
                        (entry) => entry.key !== key,
                    );
                    if (
                        others.length >= DOWNLOAD_LIMIT ||
                        others.reduce(
                            (total, entry) => total + chapterBytes(entry),
                            0,
                        ) +
                            chapterBytes(clean) >
                            DOWNLOAD_BYTES
                    ) {
                        fail(
                            'Download limit reached. Remove a chapter to stay within 50 chapters and 10 MB.',
                        );
                        return;
                    }
                    store.put({ ...clean, key });
                } catch {
                    fail(
                        'Stored downloads could not be read. Reset offline data on this device, then download again.',
                    );
                }
            };
        },
        true,
    );
}
export function removeChapter(bookId: string, chapter: number) {
    return transaction<void>(
        ['chapters'],
        'readwrite',
        (tx) => {
            tx.objectStore('chapters').delete(chapterKey(bookId, chapter));
        },
        true,
    );
}
export function clearChapters() {
    return transaction<void>(
        ['chapters'],
        'readwrite',
        (tx) => {
            tx.objectStore('chapters').clear();
        },
        true,
    );
}
export function loggingOwner() {
    return transaction<number | null>(['meta'], 'readonly', (tx, result) => {
        const request = tx.objectStore('meta').get('logging');
        request.onsuccess = () => {
            const value: unknown = request.result;
            result(
                isObject(value) &&
                    Number.isInteger(value.ownerId) &&
                    Number(value.ownerId) > 0
                    ? Number(value.ownerId)
                    : null,
            );
        };
    });
}
export function setLoggingOwner(ownerId: number | null) {
    return transaction<void>(
        ['meta'],
        'readwrite',
        (tx) => {
            if (
                ownerId !== null &&
                (!Number.isInteger(ownerId) || ownerId <= 0)
            )
                throw new Error('Sign in before enabling offline logs.');
            if (ownerId === null) tx.objectStore('meta').delete('logging');
            else tx.objectStore('meta').put({ key: 'logging', ownerId });
        },
        true,
    );
}
export function pendingReadings(ownerId: number) {
    return transaction<OfflineReading[]>(
        ['queue'],
        'readonly',
        (tx, result) => {
            const request = tx
                .objectStore('queue')
                .index('owner')
                .getAll(ownerId);
            request.onsuccess = () =>
                result((request.result as unknown[]).filter(isReading));
        },
    );
}
export async function queueReading(
    ownerId: number,
    chapter: Pick<OfflineChapter, 'bookId' | 'chapter'>,
    date = localToday(),
) {
    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !Number.isFinite(Date.parse(`${date}T00:00:00Z`)) ||
        new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date ||
        date > localToday()
    )
        throw new Error('Choose a valid reading date through today.');
    if (!crypto.randomUUID)
        throw new Error('Use HTTPS to enable offline reading logs.');
    const entry: OfflineReading = {
        client_id: crypto.randomUUID(),
        owner_id: ownerId,
        book_id: chapter.bookId,
        chapter: chapter.chapter,
        translation: 'web',
        read_on: date,
        error: null,
    };
    if (!isReading(entry)) throw new Error('This reading could not be queued.');
    return transaction<string>(
        ['queue', 'meta'],
        'readwrite',
        (tx, result, fail) => {
            const enabled = tx.objectStore('meta').get('logging');
            enabled.onsuccess = () => {
                if (enabled.result?.ownerId !== ownerId) {
                    fail(
                        'Offline logging is disabled for this account. Enable it from Downloads while signed in.',
                    );
                    return;
                }
                const store = tx.objectStore('queue');
                const request = store.getAll();
                request.onsuccess = () => {
                    const entries = request.result as OfflineReading[];
                    const existing = entries.find(
                        (item) =>
                            item.owner_id === ownerId &&
                            item.book_id === entry.book_id &&
                            item.chapter === entry.chapter &&
                            item.translation === 'web' &&
                            item.read_on === date,
                    );
                    if (existing) {
                        result(existing.client_id);
                        return;
                    }
                    if (entries.length >= QUEUE_LIMIT) {
                        fail(
                            'This device has 200 pending logs. Reconnect and sync or discard pending logs before adding more.',
                        );
                        return;
                    }
                    store.add(entry);
                    result(entry.client_id);
                };
            };
        },
        true,
    );
}
export function removePending(ownerId: number, clientId: string) {
    return transaction<void>(
        ['queue'],
        'readwrite',
        (tx) => {
            const store = tx.objectStore('queue');
            const request = store.get(clientId);
            request.onsuccess = () => {
                if (request.result?.owner_id === ownerId)
                    store.delete(clientId);
            };
        },
        true,
    );
}
export function setPendingError(
    ownerId: number,
    clientId: string,
    error: string | null,
) {
    return transaction<void>(
        ['queue'],
        'readwrite',
        (tx) => {
            const store = tx.objectStore('queue');
            const request = store.get(clientId);
            request.onsuccess = () => {
                if (request.result?.owner_id === ownerId)
                    store.put({ ...request.result, error });
            };
        },
        true,
    );
}

export function resetOfflineData() {
    return transaction<void>(
        ['chapters', 'queue', 'meta'],
        'readwrite',
        (tx) => {
            for (const name of ['chapters', 'queue', 'meta'])
                tx.objectStore(name).clear();
        },
        true,
    );
}
