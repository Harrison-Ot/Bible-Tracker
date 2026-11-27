import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

type InstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
};

// Capture the browser's one-time event even before React has mounted.
let pendingInstallPrompt: InstallPromptEvent | null = null;
if (typeof window !== 'undefined') {
    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        pendingInstallPrompt = event as InstallPromptEvent;
    });
    window.addEventListener('appinstalled', () => {
        pendingInstallPrompt = null;
    });
}

const PwaInstallContext = createContext<{
    isInstalled: boolean;
    isIos: boolean;
    canPrompt: boolean;
    installing: boolean;
    install: () => Promise<void>;
} | null>(null);

export function PwaInstallProvider({ children }: { children: ReactNode }) {
    const promptRef = useRef<InstallPromptEvent | null>(null);
    const busyRef = useRef(false);
    const installedRef = useRef(false);
    const [canPrompt, setCanPrompt] = useState(false);
    const [isIos, setIsIos] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [installing, setInstalling] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);
    const [isSecure, setIsSecure] = useState(true);
    const [isEmbedded, setIsEmbedded] = useState(false);
    const [installRequested, setInstallRequested] = useState(false);

    useEffect(() => {
        const userAgent = window.navigator.userAgent;
        setIsSecure(window.isSecureContext);
        setIsEmbedded(
            /FBAN|FBAV|Instagram|WhatsApp|Line\/|; wv\)/i.test(userAgent),
        );
        setIsIos(
            /iPad|iPhone|iPod/.test(userAgent) ||
                (userAgent.includes('Mac') && 'ontouchend' in document),
        );
        const standalone = window.matchMedia('(display-mode: standalone)');
        const updateInstalled = () => {
            installedRef.current =
                standalone.matches ||
                ('standalone' in window.navigator &&
                    window.navigator.standalone === true);
            setIsInstalled(installedRef.current);
        };
        updateInstalled();
        if (pendingInstallPrompt) {
            promptRef.current = pendingInstallPrompt;
            setCanPrompt(true);
        }
        const handleInstallAvailable = (event: Event) => {
            event.preventDefault();
            promptRef.current = event as InstallPromptEvent;
            setCanPrompt(true);
        };
        const handleInstalled = () => {
            installedRef.current = true;
            setIsInstalled(true);
            setInstallRequested(false);
            promptRef.current = null;
            setCanPrompt(false);
            setShowInstructions(false);
        };
        window.addEventListener('beforeinstallprompt', handleInstallAvailable);
        window.addEventListener('appinstalled', handleInstalled);
        standalone.addEventListener('change', updateInstalled);
        return () => {
            window.removeEventListener(
                'beforeinstallprompt',
                handleInstallAvailable,
            );
            window.removeEventListener('appinstalled', handleInstalled);
            standalone.removeEventListener('change', updateInstalled);
        };
    }, []);

    const install = async () => {
        if (busyRef.current || installedRef.current || isInstalled) return;
        if (!window.isSecureContext || isEmbedded) {
            setShowInstructions(true);
            return;
        }
        const prompt = promptRef.current;
        if (!prompt) {
            setShowInstructions(true);
            return;
        }
        setShowInstructions(false);
        setInstallRequested(false);
        promptRef.current = null;
        pendingInstallPrompt = null;
        setCanPrompt(false);
        busyRef.current = true;
        setInstalling(true);
        try {
            await prompt.prompt();
            const choice = await prompt.userChoice;
            if (choice.outcome === 'accepted' && !installedRef.current) {
                setInstallRequested(true);
                setShowInstructions(true);
            }
        } catch {
            setShowInstructions(true);
        } finally {
            busyRef.current = false;
            setInstalling(false);
        }
    };

    return (
        <PwaInstallContext.Provider
            value={{ isInstalled, isIos, canPrompt, installing, install }}
        >
            {children}
            <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Install Bible Tracker</DialogTitle>
                        <DialogDescription>
                            Add Bible Tracker to your home screen for quick
                            access. No account is needed to install.
                        </DialogDescription>
                    </DialogHeader>
                    {!isSecure ? (
                        <p role="alert" className="text-destructive text-sm">
                            Installation requires a secure HTTPS website. Open
                            the published https:// address. A local http://
                            address shared from a computer will not support app
                            installation on your phone.
                        </p>
                    ) : isEmbedded ? (
                        <p className="text-sm leading-relaxed">
                            This page appears to be open inside another app. Use
                            its menu to open the link in Safari on iPhone, or
                            Chrome or Samsung Internet on Android, then choose
                            Install app again.
                        </p>
                    ) : installRequested ? (
                        <p role="status" className="text-sm leading-relaxed">
                            Installation was requested. Complete any remaining
                            browser prompts, then look for Bible Tracker on your
                            home screen or in your app list. If it does not
                            appear, use the browser menu to try again.
                        </p>
                    ) : isIos ? (
                        <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed">
                            <li>Open this website in Safari.</li>
                            <li>
                                Open Share (it may be inside the browser More
                                menu).
                            </li>
                            <li>
                                Choose Add to Home Screen. If it is missing,
                                scroll through the share actions or check Edit
                                Actions.
                            </li>
                            <li>
                                Turn on Open as Web App if offered, then tap
                                Add.
                            </li>
                        </ol>
                    ) : (
                        <div className="space-y-3 text-sm leading-relaxed">
                            <ol className="list-decimal space-y-2 pl-5">
                                <li>
                                    Open this website in Chrome or Samsung
                                    Internet on Android, or a browser that
                                    supports web app installation.
                                </li>
                                <li>
                                    Open the browser menu and choose Install app
                                    or Add to Home screen.
                                </li>
                                <li>
                                    Confirm Install or Add. The wording depends
                                    on your browser.
                                </li>
                            </ol>
                            <p className="text-muted-foreground">
                                If the option is missing, use a regular browsing
                                tab rather than private mode, check whether the
                                app is already installed, and reload the page.
                                Desktop browsers may show an install icon in the
                                address bar.
                            </p>
                        </div>
                    )}
                    {!isIos && isSecure && !isEmbedded && (
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            If Android reports that the app was built for an
                            older version, update your browser and try again. If
                            you are using Samsung Internet, open this website in
                            an up-to-date Chrome browser and install from there.
                            Keep Play Protect enabled.
                        </p>
                    )}
                    {canPrompt &&
                        isSecure &&
                        !isEmbedded &&
                        !installRequested && (
                            <button
                                type="button"
                                onClick={() => void install()}
                                disabled={installing}
                                className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium disabled:opacity-60"
                            >
                                {installing ? 'Installing...' : 'Install now'}
                            </button>
                        )}
                </DialogContent>
            </Dialog>
        </PwaInstallContext.Provider>
    );
}

export function usePwaInstall() {
    const context = useContext(PwaInstallContext);
    if (!context)
        throw new Error('PWA installation requires PwaInstallProvider.');
    return context;
}
