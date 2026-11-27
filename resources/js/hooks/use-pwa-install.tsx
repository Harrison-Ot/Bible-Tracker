import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { toast } from 'sonner';

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

    useEffect(() => {
        const userAgent = window.navigator.userAgent;
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
            promptRef.current = null;
            setCanPrompt(false);
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
        const prompt = promptRef.current;
        if (!prompt) {
            toast.info(
                !window.isSecureContext
                    ? 'Open the HTTPS website to install.'
                    : isIos
                      ? 'Tap Share, then Add to Home Screen.'
                      : 'Choose Install app or Add to Home screen in your browser menu.',
            );
            return;
        }
        promptRef.current = null;
        pendingInstallPrompt = null;
        setCanPrompt(false);
        busyRef.current = true;
        setInstalling(true);
        try {
            await prompt.prompt();
            await prompt.userChoice;
        } catch {
            toast.error('Installation could not start. Please try again.');
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
        </PwaInstallContext.Provider>
    );
}

export function usePwaInstall() {
    const context = useContext(PwaInstallContext);
    if (!context)
        throw new Error('PWA installation requires PwaInstallProvider.');
    return context;
}
