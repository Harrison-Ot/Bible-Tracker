import { useEffect, useState } from 'react';

type InstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export default function PwaInstallPrompt() {
    const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
    const [isIos, setIsIos] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        const userAgent = window.navigator.userAgent;
        const ios = /iPad|iPhone|iPod/.test(userAgent) ||
            (userAgent.includes('Mac') && 'ontouchend' in document);
        setIsIos(ios);
        setIsInstalled(
            window.matchMedia('(display-mode: standalone)').matches ||
                ('standalone' in window.navigator && window.navigator.standalone === true),
        );

        const handleInstallAvailable = (event: Event) => {
            event.preventDefault();
            setInstallPrompt(event as InstallPromptEvent);
        };
        const handleInstalled = () => {
            setIsInstalled(true);
            setInstallPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handleInstallAvailable);
        window.addEventListener('appinstalled', handleInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleInstallAvailable);
            window.removeEventListener('appinstalled', handleInstalled);
        };
    }, []);

    if (isInstalled || dismissed || (!installPrompt && !isIos)) {
        return null;
    }

    const install = async () => {
        if (!installPrompt) return;
        await installPrompt.prompt();
        const choice = await installPrompt.userChoice;
        if (choice.outcome === 'accepted') {
            setInstallPrompt(null);
        }
    };

    return (
        <aside className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-lg items-center gap-3 rounded-xl border bg-background p-4 text-foreground shadow-lg sm:inset-x-auto sm:right-6">
            <img src="/pwa-icon.svg" alt="" className="size-12 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
                <p className="font-semibold">Install Bible Tracker</p>
                <p className="text-sm text-muted-foreground">
                    {isIos
                        ? 'Tap Share, then “Add to Home Screen” to install.'
                        : 'Add the app to your home screen for quick access.'}
                </p>
            </div>
            {installPrompt && (
                <button
                    type="button"
                    onClick={install}
                    className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
                >
                    Install
                </button>
            )}
            <button
                type="button"
                onClick={() => setDismissed(true)}
                aria-label="Dismiss install prompt"
                className="rounded-md px-2 py-1 text-lg text-muted-foreground hover:bg-muted"
            >
                ×
            </button>
        </aside>
    );
}
