import AppLogoIcon from '@/components/app-logo-icon';
import { Head, Link, usePage } from '@inertiajs/react';
import PwaInstallPrompt from '@/components/pwa-install-prompt';
import {
    ArrowDown,
    ArrowRight,
    BookOpen,
    Check,
    Heart,
    Leaf,
    NotebookPen,
    Sunrise,
    Users,
} from 'lucide-react';
import { dashboard, login, register } from '@/routes';
import type { CSSProperties } from 'react';

const serif: CSSProperties = { fontFamily: 'Fraunces, Georgia, serif' };
const primaryButton =
    'inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-[#244b3b] px-7 py-3.5 text-sm font-medium text-white transition hover:bg-[#17372a] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#244b3b]';
const practices = [
    {
        icon: BookOpen,
        label: '01 / MAKE ROOM',
        title: 'A little time. A living Word.',
        body: 'Open a chapter, follow a reading plan, or return to a passage you love. Let a few quiet minutes become the best part of your day.',
    },
    {
        icon: NotebookPen,
        label: '02 / TAKE IT TO HEART',
        title: 'Keep what speaks to you.',
        body: 'Save a verse to carry with you. Write a reflection in your reading journal. Give the words room to shape your everyday life.',
    },
    {
        icon: Users,
        label: '03 / WALK TOGETHER',
        title: 'Faith grows in company.',
        body: 'Invite your connections into a private reading group. Follow a shared plan, share check-ins, and encourage one another inside the app.',
    },
];

export default function Welcome() {
    const { auth } = usePage().props;
    const startHref = auth.user ? dashboard() : register();
    const startLabel = auth.user
        ? 'Continue your journey'
        : 'Begin your journey';

    return (
        <>
            <Head title="Make room for the Word">
                <meta
                    name="description"
                    content="Make space for Scripture every day. Read the Bible, follow a plan, save meaningful verses, and grow together with Bible Tracker."
                />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;1,9..144,400&family=Inter:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </Head>
            <div
                className="min-h-screen bg-[#faf8f2] text-[#243c30] selection:bg-[#dde5d3]"
                style={{ fontFamily: 'Inter, sans-serif' }}
            >
                <a
                    href="#main-content"
                    className="sr-only fixed top-4 left-4 z-50 rounded bg-white p-3 focus:not-sr-only"
                >
                    Skip to content
                </a>
                <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-6 sm:px-8 lg:px-12">
                    <Link
                        href="/"
                        aria-label="Bible Tracker home"
                        className="flex shrink-0 items-center gap-2.5"
                    >
                        <span className="flex size-9 items-center justify-center rounded-full bg-[#244b3b] text-[#faf8f2]">
                            <AppLogoIcon className="size-5" />
                        </span>
                        <span
                            className="text-lg font-medium tracking-tight"
                            style={serif}
                        >
                            Bible Tracker
                            <span className="text-[#9a7945]">.</span>
                        </span>
                    </Link>
                    <nav
                        aria-label="Main navigation"
                        className="hidden items-center gap-8 text-xs font-medium text-[#526255] md:flex"
                    >
                        <a
                            href="#the-journey"
                            className="transition hover:text-[#244b3b]"
                        >
                            The journey
                        </a>
                        <a
                            href="#your-rhythm"
                            className="transition hover:text-[#244b3b]"
                        >
                            Find your rhythm
                        </a>
                        <a
                            href="#a-moment-of-peace"
                            className="transition hover:text-[#244b3b]"
                        >
                            A moment of peace
                        </a>
                    </nav>
                    <div className="flex items-center gap-5 text-xs font-medium">
                        {!auth.user && (
                            <Link
                                href={login()}
                                className="hidden hover:underline sm:block"
                            >
                                Log in
                            </Link>
                        )}
                        <Link
                            href={startHref}
                            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#244b3b]/25 px-4 transition hover:bg-[#e9eddf] sm:px-5"
                        >
                            {auth.user ? 'Dashboard' : 'Get started'}
                            <ArrowRight
                                className="size-3.5"
                                aria-hidden="true"
                            />
                        </Link>
                    </div>
                </header>

                <main id="main-content">
                    <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pt-9 pb-16 sm:px-8 sm:pt-14 lg:grid-cols-[1fr_1.05fr] lg:gap-14 lg:px-12 lg:pt-16 lg:pb-24">
                        <div className="max-w-xl">
                            <p className="mb-6 flex items-center gap-2 text-[10px] font-semibold tracking-[0.22em] text-[#7d714e] uppercase">
                                <Sunrise
                                    className="size-4"
                                    aria-hidden="true"
                                />{' '}
                                A little stillness. A deeper faith.
                            </p>
                            <h1
                                className="text-5xl leading-[1.08] tracking-[-0.045em] sm:text-6xl lg:text-[76px]"
                                style={serif}
                            >
                                Make room
                                <br />
                                for the{' '}
                                <em className="font-normal text-[#70835b]">
                                    Word.
                                </em>
                            </h1>
                            <p className="mt-7 max-w-sm text-[15px] leading-7 text-[#667065]">
                                Step away from the noise and into Scripture.
                                Build a daily rhythm of reading, reflection, and
                                growing closer to God—one chapter at a time.
                            </p>
                            <div className="mt-8 flex flex-wrap items-center gap-6">
                                <PwaInstallPrompt inline />
                                <Link
                                    href={startHref}
                                    className={primaryButton}
                                >
                                    {startLabel}
                                    <ArrowRight
                                        className="size-4"
                                        aria-hidden="true"
                                    />
                                </Link>
                                <a
                                    href="#the-journey"
                                    className="inline-flex min-h-12 items-center gap-2 text-xs font-medium"
                                >
                                    Explore the journey
                                    <ArrowDown
                                        className="size-3.5"
                                        aria-hidden="true"
                                    />
                                </a>
                            </div>
                            {!auth.user && (
                                <p className="mt-4 text-xs text-[#667065]">
                                    Already have an account?{' '}
                                    <Link
                                        href={login()}
                                        className="underline underline-offset-4"
                                    >
                                        Welcome back
                                    </Link>
                                </p>
                            )}
                            <div className="mt-10 flex items-center gap-3 border-t border-[#dedfd3] pt-5 text-xs text-[#667065]">
                                <Leaf
                                    className="size-5 text-[#7a8c67]"
                                    aria-hidden="true"
                                />
                                <span>
                                    No perfect streak required. Just a willing
                                    heart.
                                </span>
                            </div>
                        </div>
                        <div className="relative isolate pb-9 pl-4 sm:pl-8">
                            <div
                                aria-hidden="true"
                                className="absolute top-7 right-[-8px] bottom-14 left-10 -z-10 rounded-t-[150px] rounded-b-2xl bg-[#e8e9dc] sm:right-[-16px]"
                            />
                            <img
                                src="/images/scripture-morning.webp"
                                alt="An open Bible on an oak table in soft morning light, beside a cup of tea and an olive branch"
                                width={1536}
                                height={1024}
                                fetchPriority="high"
                                className="aspect-[5/5.4] w-full rounded-t-[150px] rounded-b-2xl object-cover sm:rounded-t-[190px]"
                            />
                            <div className="absolute right-4 bottom-0 left-0 rounded-xl border border-[#e5e3d8] bg-[#fffdf7] p-5 shadow-[0_12px_40px_-20px_#243c3055] sm:right-12 sm:p-6">
                                <p className="mb-2 flex items-center gap-2 text-[9px] font-semibold tracking-[0.2em] text-[#7d714e] uppercase">
                                    <span className="size-1.5 rounded-full bg-[#8c9b73]" />{' '}
                                    An invitation for today
                                </p>
                                <p
                                    className="text-xl leading-snug sm:text-2xl"
                                    style={serif}
                                >
                                    “Be still, and know that I am God.”
                                </p>
                                <p className="mt-2 text-[10px] tracking-widest text-[#737b6d] uppercase">
                                    Psalm 46:10 · KJV
                                </p>
                            </div>
                        </div>
                    </section>

                    <div className="border-y border-[#e0e2d6] bg-[#f1f2e8]">
                        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-12 gap-y-4 px-6 py-6 text-xs text-[#5e6f5b] sm:justify-between">
                            {[
                                { icon: BookOpen, text: 'Rooted in Scripture' },
                                { icon: Heart, text: 'Space for reflection' },
                                { icon: Leaf, text: 'Progress at your pace' },
                                { icon: Users, text: 'Better together' },
                            ].map(({ icon: Icon, text }) => (
                                <span
                                    key={text}
                                    className="flex items-center gap-2.5"
                                >
                                    <Icon
                                        className="size-4"
                                        strokeWidth={1.5}
                                        aria-hidden="true"
                                    />
                                    {text}
                                </span>
                            ))}
                        </div>
                    </div>

                    <section
                        id="the-journey"
                        className="mx-auto max-w-7xl scroll-mt-8 px-5 py-20 sm:px-8 lg:px-12 lg:py-24"
                    >
                        <div className="mx-auto max-w-xl text-center">
                            <p className="text-[10px] font-semibold tracking-[0.22em] text-[#85774e] uppercase">
                                A faith-filled everyday
                            </p>
                            <h2
                                className="mt-4 text-4xl leading-tight tracking-tight sm:text-5xl"
                                style={serif}
                            >
                                Small moments.
                                <br />
                                <em className="font-normal text-[#70835b]">
                                    Lasting roots.
                                </em>
                            </h2>
                            <p className="mt-5 text-sm leading-7 text-[#667065]">
                                You don’t need to read it all today. You only
                                need a place to begin—and a gentle way to keep
                                going.
                            </p>
                        </div>
                        <div className="mt-14 grid gap-9 md:grid-cols-3 md:gap-8">
                            {practices.map(
                                ({ icon: Icon, label, title, body }) => (
                                    <article
                                        key={label}
                                        className="border-t border-[#d9ddcf] pt-7"
                                    >
                                        <div className="mb-8 flex items-center justify-between">
                                            <span className="flex size-11 items-center justify-center rounded-full bg-[#edf0e3]">
                                                <Icon
                                                    className="size-5 text-[#5e7651]"
                                                    strokeWidth={1.5}
                                                    aria-hidden="true"
                                                />
                                            </span>
                                            <span className="text-[9px] tracking-[0.15em] text-[#777c68]">
                                                {label}
                                            </span>
                                        </div>
                                        <h3
                                            className="text-2xl tracking-tight"
                                            style={serif}
                                        >
                                            {title}
                                        </h3>
                                        <p className="mt-4 text-sm leading-7 text-[#667065]">
                                            {body}
                                        </p>
                                    </article>
                                ),
                            )}
                        </div>
                    </section>

                    <section
                        id="your-rhythm"
                        className="mx-auto max-w-7xl scroll-mt-8 px-5 pb-20 sm:px-8 lg:px-12 lg:pb-24"
                    >
                        <div className="grid overflow-hidden rounded-3xl bg-[#eaeedf] lg:grid-cols-2">
                            <div className="flex flex-col justify-center p-7 sm:p-12 lg:p-14">
                                <p className="text-[10px] font-semibold tracking-[0.22em] text-[#6a795c] uppercase">
                                    A rhythm that feels like you
                                </p>
                                <h2
                                    className="mt-4 text-4xl leading-tight tracking-tight sm:text-5xl"
                                    style={serif}
                                >
                                    Less wondering
                                    <br />
                                    where to start.
                                    <br />
                                    <em className="font-normal text-[#70835b]">
                                        More time in the Word.
                                    </em>
                                </h2>
                                <p className="mt-6 max-w-sm text-sm leading-7 text-[#5e6c59]">
                                    Let a reading plan guide your next chapter.
                                    See your reading history grow, revisit a
                                    saved verse, and pick up where you left off.
                                </p>
                                <Link
                                    href={
                                        auth.user
                                            ? '/reading-plans'
                                            : register()
                                    }
                                    className="mt-8 inline-flex min-h-11 items-center gap-3 self-start border-b border-[#748364] text-xs font-semibold"
                                >
                                    Find your reading rhythm
                                    <ArrowRight
                                        className="size-4"
                                        aria-hidden="true"
                                    />
                                </Link>
                            </div>
                            <div className="flex items-center justify-center bg-[#e0e6d2] p-7 sm:p-12 lg:p-14">
                                <div className="w-full max-w-sm rotate-[-2deg] rounded-2xl border border-white/70 bg-[#fffef9] p-6 shadow-[0_18px_50px_-25px_#40533355] sm:p-8">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-semibold tracking-[0.18em] text-[#7a826d] uppercase">
                                            A little inspiration
                                        </span>
                                        <BookOpen
                                            className="size-5 text-[#728661]"
                                            aria-hidden="true"
                                        />
                                    </div>
                                    <p className="mt-7 text-xs text-[#7b816f]">
                                        A place to begin
                                    </p>
                                    <h3 className="mt-2 text-3xl" style={serif}>
                                        The Good Shepherd
                                    </h3>
                                    <p className="mt-2 text-xs text-[#6d7965]">
                                        Psalm 23 · 6 verses
                                    </p>
                                    <blockquote
                                        className="my-6 border-l-2 border-[#bdc7a4] pl-4 text-lg leading-relaxed text-[#526349]"
                                        style={serif}
                                    >
                                        “The Lord is my shepherd; I shall not
                                        want.”
                                        <cite className="mt-2 block font-sans text-[10px] text-[#76816b] not-italic">
                                            Psalm 23:1 · KJV
                                        </cite>
                                    </blockquote>
                                    <div className="flex items-center gap-2 border-t border-[#e6e8dc] pt-5 text-xs text-[#68785b]">
                                        <Check
                                            className="size-4"
                                            aria-hidden="true"
                                        />
                                        A small chapter. A meaningful beginning.
                                    </div>
                                    <Link
                                        href={
                                            auth.user
                                                ? '/bible/PSA/23'
                                                : login()
                                        }
                                        className="mt-6 flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#244b3b] px-4 text-xs font-medium text-white transition hover:bg-[#17372a]"
                                    >
                                        Read Psalm 23
                                        <ArrowRight
                                            className="size-3.5"
                                            aria-hidden="true"
                                        />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section
                        id="a-moment-of-peace"
                        className="relative isolate flex min-h-[420px] scroll-mt-8 items-center justify-center overflow-hidden bg-[#233d2e] px-6 py-20 text-center text-[#fffdf5] sm:min-h-[480px]"
                    >
                        <img
                            src="/images/quiet-hills.webp"
                            alt="Soft sunrise over peaceful green hills and a misty valley"
                            width={1536}
                            height={1024}
                            loading="lazy"
                            decoding="async"
                            className="absolute inset-0 -z-20 size-full object-cover"
                        />
                        <div
                            className="absolute inset-0 -z-10 bg-[#122d21]/65"
                            aria-hidden="true"
                        />
                        <div className="max-w-3xl">
                            <Leaf
                                className="mx-auto mb-7 size-7 text-[#e4ddbd]"
                                strokeWidth={1.25}
                                aria-hidden="true"
                            />
                            <p className="mb-5 text-[10px] tracking-[0.25em] text-[#ebe8d3] uppercase">
                                Light for the path ahead
                            </p>
                            <blockquote
                                className="text-3xl leading-snug tracking-tight sm:text-5xl"
                                style={serif}
                            >
                                “Thy word is a lamp unto my feet,
                                <br className="hidden sm:block" /> and a light
                                unto my path.”
                            </blockquote>
                            <p className="mt-6 text-[10px] tracking-[0.2em] text-[#e3e7d8] uppercase">
                                Psalm 119:105 · KJV
                            </p>
                        </div>
                    </section>

                    <section className="px-6 py-20 text-center sm:py-24">
                        <p className="text-[10px] font-semibold tracking-[0.22em] text-[#85774e] uppercase">
                            There is grace in beginning again
                        </p>
                        <h2
                            className="mx-auto mt-5 max-w-xl text-4xl leading-tight tracking-tight sm:text-5xl"
                            style={serif}
                        >
                            Your next chapter
                            <br />
                            <em className="font-normal text-[#70835b]">
                                starts with one moment.
                            </em>
                        </h2>
                        <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-[#667065]">
                            Whether it’s your first chapter or your first in a
                            while, there’s a place for you here. Open the Word.
                            Take your time.
                        </p>
                        <Link
                            href={startHref}
                            className={`${primaryButton} mt-8`}
                        >
                            {startLabel}
                            <ArrowRight className="size-4" aria-hidden="true" />
                        </Link>
                    </section>
                </main>

                <footer className="border-t border-[#dedfd3]">
                    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-6 py-8 sm:flex-row lg:px-12">
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-lg"
                            style={serif}
                        >
                            <AppLogoIcon className="size-5" />
                            Bible Tracker.
                        </Link>
                        <p className="text-xs text-[#6e7969]">
                            Rooted in the Word. Growing every day.
                        </p>
                        <a
                            href="#main-content"
                            className="text-xs text-[#52664a] underline underline-offset-4"
                        >
                            Back to the beginning ↑
                        </a>
                    </div>
                </footer>
            </div>
        </>
    );
}
