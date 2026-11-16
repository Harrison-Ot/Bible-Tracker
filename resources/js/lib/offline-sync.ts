import {
    pendingReadings,
    removePending,
    setPendingError,
} from '@/lib/offline-db';

class OfflineRequestError extends Error {
    constructor(
        message: string,
        public status: number,
    ) {
        super(message);
    }
}
export async function offlineRequest<T>(
    url: string,
    body?: unknown,
): Promise<T> {
    const cookie = document.cookie
        .split('; ')
        .find((item) => item.startsWith('XSRF-TOKEN='));
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
        const response = await fetch(url, {
            method: body ? 'POST' : 'GET',
            credentials: 'same-origin',
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...(cookie
                    ? {
                          'X-XSRF-TOKEN': decodeURIComponent(
                              cookie.slice('XSRF-TOKEN='.length),
                          ),
                      }
                    : {}),
                ...(body ? { 'Content-Type': 'application/json' } : {}),
            },
            body: body ? JSON.stringify(body) : undefined,
            signal: controller.signal,
        });
        const data = (await response.json().catch(() => null)) as {
            message?: string;
            errors?: Record<string, string[]>;
        } | null;
        if (!response.ok || !data) {
            const message =
                response.status === 401 || response.status === 419
                    ? 'Sign in again to sync your pending readings.'
                    : response.status === 403
                      ? 'Sign in to the verified account that queued these readings.'
                      : response.status === 429
                        ? 'Please wait before trying again.'
                        : data?.errors
                          ? Object.values(data.errors).flat().join(' ')
                          : 'Could not complete this request. Try again when your connection is stable.';
            throw new OfflineRequestError(message, response.status);
        }
        return data as T;
    } finally {
        clearTimeout(timeout);
    }
}
const syncing = new Map<
    number,
    Promise<{ synced: number; error: string | null }>
>();
export function syncReadings(ownerId: number, retryErrors = false) {
    const existing = syncing.get(ownerId);
    if (existing) return existing;
    const promise = (async () => {
        let synced = 0;
        let error: string | null = null;
        const pending = await pendingReadings(ownerId);
        for (const entry of pending) {
            if (entry.error && !retryErrors) continue;
            try {
                const response = await offlineRequest<{
                    client_id: string;
                    status: string;
                }>('/offline-readings', entry);
                if (
                    response.client_id !== entry.client_id ||
                    !['synced', 'already_synced'].includes(response.status)
                )
                    throw new Error(
                        'The server did not confirm this reading. It remains pending.',
                    );
                await removePending(ownerId, entry.client_id);
                synced++;
            } catch (failure) {
                error =
                    failure instanceof Error
                        ? failure.message
                        : 'Could not sync. Your readings remain on this device.';
                if (
                    failure instanceof OfflineRequestError &&
                    [409, 422].includes(failure.status)
                ) {
                    await setPendingError(ownerId, entry.client_id, error);
                    continue;
                }
                break;
            }
        }
        return { synced, error };
    })().finally(() => syncing.delete(ownerId));
    syncing.set(ownerId, promise);
    return promise;
}
export async function prepareOfflineReader() {
    if (!('serviceWorker' in navigator))
        throw new Error(
            'Offline reading needs a browser with service worker support and HTTPS.',
        );
    const registration = await navigator.serviceWorker.register('/sw.js');
    await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<never>((_, reject) =>
            setTimeout(
                () =>
                    reject(
                        new Error(
                            'Offline reader setup timed out. Try again while online.',
                        ),
                    ),
                20000,
            ),
        ),
    ]);
    const worker = registration.active;
    if (!worker)
        throw new Error(
            'The offline reader is still starting. Try again in a moment.',
        );
    await new Promise<void>((resolve, reject) => {
        const channel = new MessageChannel();
        const timeout = setTimeout(() => {
            channel.port1.close();
            reject(
                new Error(
                    'Could not prepare the offline reader. Keep your connection open and retry.',
                ),
            );
        }, 25000);
        channel.port1.onmessage = ({ data }: MessageEvent<{ ok: boolean }>) => {
            clearTimeout(timeout);
            channel.port1.close();
            if (data.ok) resolve();
            else
                reject(
                    new Error(
                        'Could not prepare the offline reader. Check your connection and retry.',
                    ),
                );
        };
        worker.postMessage({ type: 'PREPARE_OFFLINE' }, [channel.port2]);
    });
}
