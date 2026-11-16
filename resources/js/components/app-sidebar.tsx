import { Link } from '@inertiajs/react';
import {
    Bell,
    ChartNoAxesCombined,
    Bookmark,
    BookOpenCheck,
    LayoutGrid,
    MessageCircle,
    NotebookText,
    UsersRound,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';

import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { index as membersIndex } from '@/actions/App/Http/Controllers/MemberController';
import { index as notificationsIndex } from '@/actions/App/Http/Controllers/NotificationController';
import { index as readingPlansIndex } from '@/actions/App/Http/Controllers/ReadingPlanController';
import { index as chatsIndex } from '@/actions/App/Http/Controllers/ChatController';
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
        title: 'Saved verses',
        href: '/saved-verses',
        icon: Bookmark,
    },
    {
        title: 'Reading journal',
        href: '/journal',
        icon: NotebookText,
    },
    {
        title: 'Reading Plans',
        href: readingPlansIndex(),
        icon: BookOpenCheck,
    },
    {
        title: 'Reading progress',
        href: '/reports',
        icon: ChartNoAxesCombined,
    },
    {
        title: 'Reading groups',
        href: '/groups',
        icon: UsersRound,
    },
    {
        title: 'Members',
        href: membersIndex(),
        icon: UsersRound,
    },
    {
        title: 'Chats',
        href: chatsIndex(),
        icon: MessageCircle,
    },
    {
        title: 'Notifications',
        href: notificationsIndex(),
        icon: Bell,
    },
];

export function AppSidebar() {
    const unreadNotificationCount = usePage<{
        unreadNotificationCount: number;
    }>().props.unreadNotificationCount;
    const navItems = mainNavItems.map((item) =>
        item.title === 'Notifications'
            ? { ...item, badge: unreadNotificationCount }
            : item,
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
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
