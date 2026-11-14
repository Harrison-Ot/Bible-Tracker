import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import MobileNavigation from '@/components/mobile-navigation';
import { useReadingMode } from '@/hooks/use-reading-mode';
import type { AppLayoutProps } from '@/types';
import type { CSSProperties } from 'react';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const { focused } = useReadingMode();
    return (
        <AppShell variant="sidebar">
            {!focused && <AppSidebar />}
            <AppContent
                variant="sidebar"
                className="min-w-0 overflow-x-clip pb-[var(--mobile-nav-height)]"
                style={
                    focused
                        ? ({ '--mobile-nav-height': '0px' } as CSSProperties)
                        : undefined
                }
            >
                {!focused && <AppSidebarHeader breadcrumbs={breadcrumbs} />}
                {children}
            </AppContent>
            {!focused && <MobileNavigation />}
        </AppShell>
    );
}
