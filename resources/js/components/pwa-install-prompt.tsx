import { useReadingMode } from '@/hooks/use-reading-mode';
import { usePwaInstall } from '@/hooks/use-pwa-install';
import { useState } from 'react';
import { Download, X } from 'lucide-react';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';

export default function PwaInstallPrompt({
    sidebar = false,
    inline = false,
}: {
    sidebar?: boolean;
    inline?: boolean;
}) {
    const { focused } = useReadingMode();
    const { isInstalled, isIos, canPrompt, installing, install } =
        usePwaInstall();
    const [dismissed, setDismissed] = useState(false);

    if (focused || isInstalled) return null;
    if (inline) {
        return (
            <button
                type="button"
                onClick={install}
                disabled={installing}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#244b3b]/30 px-6 py-3 text-sm font-medium text-[#244b3b] transition hover:bg-[#e9eddf] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#244b3b] disabled:opacity-60"
            >
                <Download className="size-4" aria-hidden="true" />
                {installing ? 'Installing…' : 'Install app'}
            </button>
        );
    }
    if (sidebar) {
        return (
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton
                        onClick={install}
                        disabled={installing}
                        tooltip="Install app"
                    >
                        <Download />
                        <span>
                            {installing ? 'Installing…' : 'Install app'}
                        </span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        );
    }
    if (dismissed || (!canPrompt && !isIos)) return null;

    return (
        <aside className="bg-background text-foreground fixed inset-x-4 bottom-[calc(var(--mobile-nav-height,0px)+1rem)] z-50 mx-auto flex max-w-lg items-center gap-3 rounded-xl border p-4 shadow-lg sm:inset-x-auto sm:right-6">
            <img
                src="/pwa-icon.svg"
                alt=""
                className="size-12 shrink-0 rounded-xl"
            />
            <div className="min-w-0 flex-1">
                <p className="font-semibold">Install Bible Tracker</p>
                <p className="text-muted-foreground text-sm">
                    {isIos
                        ? 'Tap Share, then "Add to Home Screen" to install.'
                        : 'Quick access from your home screen. No account needed to install.'}
                </p>
            </div>
            <button
                type="button"
                onClick={install}
                disabled={installing}
                className="bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm font-medium disabled:opacity-60"
            >
                {installing ? 'Installing…' : 'Install'}
            </button>
            <button
                type="button"
                onClick={() => setDismissed(true)}
                aria-label="Dismiss install prompt"
                className="text-muted-foreground hover:bg-muted rounded-md p-2"
            >
                <X className="size-4" aria-hidden="true" />
            </button>
        </aside>
    );
}
