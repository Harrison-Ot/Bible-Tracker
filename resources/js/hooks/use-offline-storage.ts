import { useCallback, useEffect, useRef, useState } from 'react';
import {
    downloadedChapters,
    loggingOwner,
    observeOffline,
    pendingReadings,
    type OfflineChapter,
    type OfflineReading,
} from '@/lib/offline-db';
export function useOfflineStorage(ownerId?: number) {
    const [chapters, setChapters] = useState<OfflineChapter[]>([]);
    const [queue, setQueue] = useState<OfflineReading[]>([]);
    const [enabledOwner, setEnabledOwner] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [loaded, setLoaded] = useState(false);
    const [queueOwner, setQueueOwner] = useState(ownerId);
    const ownerRef = useRef(ownerId);
    ownerRef.current = ownerId;
    const version = useRef(0);
    const refresh = useCallback(async () => {
        const currentVersion = ++version.current;
        try {
            const [downloads, owner, entries] = await Promise.all([
                downloadedChapters(),
                loggingOwner(),
                ownerId ? pendingReadings(ownerId) : Promise.resolve([]),
            ]);
            if (
                ownerRef.current !== ownerId ||
                version.current !== currentVersion
            )
                return;
            setChapters(downloads);
            setEnabledOwner(owner);
            setQueue(entries);
            setQueueOwner(ownerId);
            setError('');
        } catch (failure) {
            if (
                ownerRef.current !== ownerId ||
                version.current !== currentVersion
            )
                return;
            setError(
                failure instanceof Error
                    ? failure.message
                    : 'Offline storage is unavailable.',
            );
        } finally {
            if (
                ownerRef.current === ownerId &&
                version.current === currentVersion
            )
                setLoaded(true);
        }
    }, [ownerId]);
    useEffect(() => {
        let active = true;
        const run = () => {
            if (active) void refresh();
        };
        run();
        const stop = observeOffline(run);
        return () => {
            active = false;
            version.current++;
            stop();
        };
    }, [refresh]);
    return {
        chapters,
        queue: queueOwner === ownerId ? queue : [],
        enabledOwner,
        error,
        loaded,
        refresh,
    };
}
