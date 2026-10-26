import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { cn } from '@/lib/utils';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
    variant = 'login',
}: AuthLayoutProps) {
    const isLogin = variant === 'login';

    return (
        <main className="min-h-svh bg-background lg:grid lg:grid-cols-2">
            <section
                className={cn(
                    'relative hidden min-h-svh overflow-hidden bg-[#e9f2e7] lg:block',
                    isLogin ? 'lg:order-1' : 'lg:order-2',
                )}
                aria-label="Bible reading community"
            >
                <img
                    src="/images/auth-community.svg"
                    alt="An open Bible on a peaceful green hillside"
                    className="absolute inset-0 size-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#173c2a]/75 via-[#173c2a]/10 to-transparent" />
                <Link
                    href={home()}
                    className="absolute left-10 top-10 z-10 flex items-center gap-3 rounded-full border border-white/30 bg-white/15 px-4 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur-md"
                >
                    <AppLogoIcon className="size-7" />
                    <span>BibleTracker</span>
                </Link>
                <div className="absolute inset-x-0 bottom-0 z-10 p-10 text-white xl:p-14">
                    <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-white/75">
                        Read. Reflect. Grow.
                    </p>
                    <p className="max-w-xl text-3xl font-semibold leading-tight xl:text-4xl">
                        Build a steady rhythm in the Word, one day at a time.
                    </p>
                    <p className="mt-4 max-w-lg text-sm leading-6 text-white/80">
                        Keep track of your reading, celebrate your progress, and
                        grow alongside a community of readers.
                    </p>
                </div>
            </section>

            <section
                className={cn(
                    'flex min-h-svh items-center justify-center px-5 py-10 sm:px-8 lg:order-2 lg:px-12',
                    !isLogin && 'lg:order-1',
                )}
            >
                <div className="w-full max-w-md">
                    <Link
                        href={home()}
                        className="mb-10 flex items-center gap-3 lg:hidden"
                    >
                        <AppLogoIcon className="size-9 rounded-md bg-primary p-1.5" />
                        <span className="text-base font-semibold tracking-tight">
                            BibleTracker
                        </span>
                    </Link>

                    <div className="mb-8 space-y-2">
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
                            {isLogin ? 'Welcome back' : 'Join the community'}
                        </p>
                        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                            {title}
                        </h1>
                        <p className="text-sm leading-6 text-muted-foreground">
                            {description}
                        </p>
                    </div>

                    {children}
                </div>
            </section>
        </main>
    );
}
