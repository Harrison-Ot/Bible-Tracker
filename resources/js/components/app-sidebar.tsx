import { Link } from '@inertiajs/react';
import { Bell, BookOpenCheck, FolderGit2, LayoutGrid, NotebookText, UsersRound } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { index as membersIndex } from '@/actions/App/Http/Controllers/MemberController';
import { index as notificationsIndex } from '@/actions/App/Http/Controllers/NotificationController';
import { index as readingPlansIndex } from '@/actions/App/Http/Controllers/ReadingPlanController';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';
import { usePage } from '@inertiajs/react';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Bible',
        href: '/bible',
        icon: NotebookText,
    },
    {
        title: 'Reading Plans',
        href: readingPlansIndex(),
        icon: BookOpenCheck,
    },
    {
        title: 'Members',
        href: membersIndex(),
        icon: UsersRound,
    },
    {
        title: 'Notifications',
        href: notificationsIndex(),
        icon: Bell,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Reports',
        href: '/reports',
        icon: FolderGit2,
    },
    {
        title: 'Groups',
        href: '/groups',
        icon: FolderGit2,
    },
];

export function AppSidebar() {
    const unreadNotificationCount = usePage<{ unreadNotificationCount: number }>().props.unreadNotificationCount;
    const navItems = mainNavItems.map((item) =>
        item.title === 'Notifications' ? { ...item, badge: unreadNotificationCount } : item,
    );

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={navItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}