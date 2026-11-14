import { Link, usePage } from '@inertiajs/react';
import { BookOpen, BookOpenCheck, House, NotebookPen } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
    {
        title: 'Home',
        href: '/dashboard',
        icon: House,
        matches: (path: string) => path === '/dashboard',
    },
    {
        title: 'Bible',
        href: '/bible',
        icon: BookOpen,
        matches: (path: string) =>
            path === '/bible' || path.startsWith('/bible/'),
    },
    {
        title: 'Plans',
        href: '/reading-plans',
        icon: BookOpenCheck,
        matches: (path: string) => path === '/reading-plans',
    },
    {
        title: 'Journal',
        href: '/journal',
        icon: NotebookPen,
        matches: (path: string) => path === '/journal',
    },
];

export default function MobileNavigation() {
    const path = usePage().url.split('?')[0];
    return (
        <nav
            aria-label="Quick navigation"
            className="bg-background/95 fixed inset-x-0 bottom-0 z-40 grid h-[var(--mobile-nav-height)] grid-cols-4 border-t px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
        >
            {items.map(({ title, href, icon: Icon, matches }) => (
                <Link
                    key={title}
                    href={href}
                    aria-current={matches(path) ? 'page' : undefined}
                    className={cn(
                        'hover:bg-accent my-1 flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg text-xs font-medium transition-colors',
                        matches(path)
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground',
                    )}
                >
                    <Icon className="size-5" aria-hidden="true" />
                    {title}
                </Link>
            ))}
        </nav>
    );
}
