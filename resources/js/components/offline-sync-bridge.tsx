import { router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { loggingOwner, setLoggingOwner } from '@/lib/offline-db';
import { syncReadings } from '@/lib/offline-sync';
import type { Auth } from '@/types';
export default function OfflineSyncBridge() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const [message, setMessage] = useState('');
    useEffect(() => {
        let active = true;
        const run = async () => {
            try {
                const enabled = await loggingOwner();
                if (!active) return;
                if (enabled !== null && enabled !== auth.user.id)
                    await setLoggingOwner(null);
                if (!navigator.onLine) return;
                const result = await syncReadings(auth.user.id);
                if (active && result.synced > 0) router.reload();
                if (active && (result.synced || result.error))
                    setMessage(
                        result.error
                            ? `${result.synced} offline readings synced. ${result.error} Pending logs are kept on this device.`
                            : `${result.synced} offline reading logs synced to your account.`,
                    );
            } catch {
                /* Device storage is optional; Downloads explains storage failures. */
            }
        };
        void run();
        window.addEventListener('online', run);
        return () => {
            active = false;
            window.removeEventListener('online', run);
        };
    }, [auth.user.id]);
    if (!message) return null;
    return (
        <div
            role="status"
            className="bg-card m-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm"
        >
            <p>
                {message}{' '}
                <a
                    href="/downloads"
                    className="text-primary font-medium underline"
                >
                    Review downloads
                </a>
            </p>
            <button
                type="button"
                className="text-muted-foreground underline"
                onClick={() => setMessage('')}
            >
                Dismiss
            </button>
        </div>
    );
}
