import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import OfflineLibrary from '@/components/offline-library';

createRoot(document.getElementById('offline-app')!).render(
    <StrictMode>
        <main className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-8">
            <header className="space-y-3">
                <a
                    href="/downloads"
                    className="text-primary text-sm font-medium hover:underline"
                >
                    Bible Tracker
                </a>
                <p className="text-primary text-xs font-semibold tracking-widest uppercase">
                    Read wherever you are
                </p>
                <h1 className="text-3xl font-semibold tracking-tight">
                    Offline reader
                </h1>
                <p className="text-muted-foreground text-sm leading-relaxed">
                    Open passages downloaded on this device. Your account and
                    private reading history stay online.
                </p>
            </header>
            <OfflineLibrary />
        </main>
    </StrictMode>,
);
