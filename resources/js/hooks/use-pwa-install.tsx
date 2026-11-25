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
    const [canPrompt, setCanPrompt] = useState(false);
    const [isIos, setIsIos] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [installing, setInstalling] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);

    useEffect(() => {
        const userAgent = window.navigator.userAgent;
        setIsIos(
            /iPad|iPhone|iPod/.test(userAgent) ||
                (userAgent.includes('Mac') && 'ontouchend' in document),
        );
        const standalone = window.matchMedia('(display-mode: standalone)');
        const updateInstalled = () =>
            setIsInstalled(
                standalone.matches ||
                    ('standalone' in window.navigator &&
                        window.navigator.standalone === true),
            );
        updateInstalled();
        const handleInstallAvailable = (event: Event) => {
            event.preventDefault();
            promptRef.current = event as InstallPromptEvent;
            setCanPrompt(true);
            setShowInstructions(false);
        };
        const handleInstalled = () => {
            setIsInstalled(true);
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
        if (busyRef.current || isInstalled) return;
        const prompt = promptRef.current;
        if (!prompt) {
            setShowInstructions(true);
            return;
        }
        promptRef.current = null;
        setCanPrompt(false);
        busyRef.current = true;
        setInstalling(true);
        try {
            await prompt.prompt();
            const choice = await prompt.userChoice;
            if (choice.outcome === 'accepted') setIsInstalled(true);
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
                            You can install Bible Tracker without an account.{' '}
                            {isIos
                                ? 'In Safari, tap Share, then "Add to Home Screen", and confirm Add.'
                                : 'Use "Install app" or "Add to Home Screen" in your browser menu, or the install icon in the address bar. If the option is missing, try Chrome or Edge, or check whether the app is already installed.'}
                        </DialogDescription>
                    </DialogHeader>
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
