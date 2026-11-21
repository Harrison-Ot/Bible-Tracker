import UserProfileMenu from '@/components/user-profile-menu';
import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    return (
        <header className="border-sidebar-border/50 flex h-16 shrink-0 items-center gap-2 border-b px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Link
                    href="/dashboard"
                    aria-label="Bible Tracker dashboard"
                    className="shrink-0 md:hidden"
                >
                    <AppLogoIcon className="size-7" />
                </Link>
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <div className="ml-auto hidden shrink-0 md:block">
                <UserProfileMenu />
            </div>
        </header>
    );
}
