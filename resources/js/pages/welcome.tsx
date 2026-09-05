import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login, register } from '@/routes';

// A tiny deterministic "contribution square" grid, reused as logomark + hero visual.
// Intensity 0-4 maps to the green scale, just like the real tracker will render.
const GRID_PATTERN: number[][] = [
    [1, 2, 0, 3, 1, 4, 2, 0, 1, 3, 2, 4],
    [0, 3, 1, 2, 4, 1, 0, 3, 2, 1, 4, 0],
    [2, 1, 4, 0, 2, 3, 1, 4, 0, 2, 1, 3],
    [3, 0, 2, 1, 3, 0, 4, 1, 2, 0, 3, 1],
    [1, 4, 0, 3, 1, 2, 0, 3, 4, 1, 0, 2],
    [0, 2, 1, 4, 0, 2, 3, 1, 0, 4, 2, 1],
    [4, 1, 3, 0, 2, 1, 0, 2, 3, 1, 4, 0],
];

const SQUARE_TONE: Record<number, string> = {
    0: 'bg-[#E4EBDF]',
    1: 'bg-[#B7DDB0]',
    2: 'bg-[#8FCB8A]',
    3: 'bg-[#2F6B3C]',
    4: 'bg-[#153D1D]',
};

function LogoMark({ size = 'h-6 w-6' }: { size?: string }) {
    return (
        <div className={`grid grid-cols-3 grid-rows-3 gap-[2px] ${size}`}>
            {[3, 1, 4, 0, 2, 3, 4, 1, 2].map((v, i) => (
                <span key={i} className={`rounded-[1px] ${SQUARE_TONE[v]}`} />
            ))}
        </div>
    );
}

function ContributionGraph() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

    return (
        <div className="w-full max-w-md rounded-lg border border-[#D9E3D3] bg-white/60 p-5">
            <div className="mb-3 flex justify-between text-xs text-[#5B6B5D]">
                {months.map((m) => (
                    <span key={m}>{m}</span>
                ))}
            </div>
            <div className="flex flex-col gap-[3px]">
                {GRID_PATTERN.map((row, r) => (
                    <div key={r} className="flex gap-[3px]">
                        {row.map((v, c) => (
                            <span key={c} className={`h-3.5 w-3.5 rounded-[2px] ${SQUARE_TONE[v]}`} />
                        ))}
                    </div>
                ))}
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-[#5B6B5D]">
                <span>212 chapters read this year</span>
                <div className="flex items-center gap-1">
                    <span>Less</span>
                    {[0, 1, 2, 3, 4].map((v) => (
                        <span key={v} className={`h-2.5 w-2.5 rounded-[2px] ${SQUARE_TONE[v]}`} />
                    ))}
                    <span>More</span>
                </div>
            </div>
        </div>
    );
}

interface Feature {
    title: string;
    body: string;
}

const FEATURES: Feature[] = [
    {
        title: 'A streak worth protecting',
        body: "Every chapter you log fills in a square. Miss a day and the streak resets — same pressure that keeps a coding streak alive, pointed at your reading habit instead.",
    },
    {
        title: 'Your WhatsApp group, kept honest',
        body: "Connect the app to your existing group chat. Each morning it posts who read and who didn't — no new app for your friends to install, just a nudge where you already talk.",
    },
    {
        title: 'Plans that pace you',
        body: 'Follow a structured plan — Bible in a Year, New Testament in 90 Days — and the app tells you exactly what\u2019s next, so you never have to decide where to pick up.',
    },
    {
        title: 'Small wins, marked',
        body: 'Finish a book, hit a 7-day streak, or read on a Sunday for a month straight — badges quietly track the milestones so progress feels real, not just logged.',
    },
];

export default function Welcome() {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Welcome">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <div className="min-h-screen bg-[#F6F8F3] text-[#16241A]" style={{ fontFamily: 'Inter, sans-serif' }}>
                {/* Navbar */}
                <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
                    <Link href="/" className="flex items-center gap-2">
                        <LogoMark />
                        <span className="text-sm font-medium tracking-tight">Bible Tracker</span>
                    </Link>

                    <nav className="flex items-center gap-3 text-sm">
                        {auth.user ? (
                            <Link
                                href={dashboard()}
                                className="rounded-full border border-[#2F6B3C]/30 px-5 py-1.5 leading-normal text-[#16241A] hover:border-[#2F6B3C] hover:bg-[#2F6B3C]/5"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={login()}
                                    className="rounded-full px-4 py-1.5 leading-normal text-[#16241A] hover:bg-[#2F6B3C]/5"
                                >
                                    Log in
                                </Link>
                                <Link
                                    href={register()}
                                    className="rounded-full bg-[#2F6B3C] px-5 py-1.5 leading-normal text-white hover:bg-[#153D1D]"
                                >
                                    Get started
                                </Link>
                            </>
                        )}
                    </nav>
                </header>

                {/* Hero */}
                <section className="mx-auto flex w-full max-w-5xl flex-col items-center gap-12 px-6 pt-8 pb-24 lg:flex-row lg:items-center lg:pt-16">
                    <div className="max-w-lg text-center lg:text-left">
                        <h1
                            className="text-5xl leading-[1.08] font-medium tracking-tight lg:text-6xl"
                            style={{ fontFamily: 'Fraunces, serif' }}
                        >
                            Read scripture like you ship code.
                        </h1>
                        <p className="mt-6 text-lg leading-relaxed text-[#3E4A3F]">
                            Log every chapter you read, watch the squares fill in, and keep your
                            reading group honest — right inside the WhatsApp chat you already use.
                        </p>
                        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                            <Link
                                href={register()}
                                className="rounded-full bg-[#2F6B3C] px-6 py-3 text-center text-sm font-medium text-white hover:bg-[#153D1D]"
                            >
                                Start your streak
                            </Link>
                            <a
                                href="#how-it-works"
                                className="rounded-full border border-[#2F6B3C]/30 px-6 py-3 text-center text-sm font-medium hover:border-[#2F6B3C]"
                            >
                                See how it works
                            </a>
                        </div>
                    </div>

                    <div className="flex w-full justify-center lg:justify-end">
                        <ContributionGraph />
                    </div>
                </section>

                {/* How it works */}
                <section id="how-it-works" className="border-t border-[#D9E3D3] bg-white/50 py-20">
                    <div className="mx-auto w-full max-w-5xl px-6">
                        <h2
                            className="max-w-md text-3xl font-medium tracking-tight"
                            style={{ fontFamily: 'Fraunces, serif' }}
                        >
                            Three steps, every day
                        </h2>

                        <div className="mt-12 grid gap-10 sm:grid-cols-3">
                            {[
                                {
                                    step: '01',
                                    title: 'Read a chapter',
                                    body: "Open today's passage in the app, or log a chapter you already read on your own.",
                                },
                                {
                                    step: '02',
                                    title: 'Mark it done',
                                    body: "One tap fills in today's square and updates your current streak.",
                                },
                                {
                                    step: '03',
                                    title: 'Your group sees it',
                                    body: 'A quiet update lands in your WhatsApp group, so the people around you know you showed up.',
                                },
                            ].map((s) => (
                                <div key={s.step}>
                                    <span className="text-sm text-[#8FA491]">{s.step}</span>
                                    <h3 className="mt-2 text-lg font-medium">{s.title}</h3>
                                    <p className="mt-2 text-sm leading-relaxed text-[#5B6B5D]">{s.body}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section className="py-20">
                    <div className="mx-auto w-full max-w-5xl px-6">
                        <h2
                            className="max-w-md text-3xl font-medium tracking-tight"
                            style={{ fontFamily: 'Fraunces, serif' }}
                        >
                            Built for people who finish what they start
                        </h2>

                        <div className="mt-12 divide-y divide-[#D9E3D3] border-t border-[#D9E3D3]">
                            {FEATURES.map((f) => (
                                <div key={f.title} className="grid gap-2 py-8 sm:grid-cols-3 sm:gap-8">
                                    <h3 className="text-lg font-medium">{f.title}</h3>
                                    <p className="text-sm leading-relaxed text-[#5B6B5D] sm:col-span-2">{f.body}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Verse pull-quote */}
                <section className="border-y border-[#D9E3D3] bg-[#153D1D] py-20 text-[#F6F8F3]">
                    <div className="mx-auto max-w-2xl px-6 text-center">
                        <p className="text-2xl leading-relaxed font-medium" style={{ fontFamily: 'Fraunces, serif' }}>
                            "This book of the law shall not depart out of thy mouth; but thou shalt
                            meditate therein day and night."
                        </p>
                        <p className="mt-4 text-sm text-[#B7DDB0]">Joshua 1:8, KJV</p>
                    </div>
                </section>

                {/* Closing CTA */}
                <section className="py-20">
                    <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-6 text-center">
                        <h2 className="max-w-lg text-3xl font-medium tracking-tight" style={{ fontFamily: 'Fraunces, serif' }}>
                            Your first square is one chapter away
                        </h2>
                        <Link
                            href={register()}
                            className="rounded-full bg-[#2F6B3C] px-8 py-3 text-sm font-medium text-white hover:bg-[#153D1D]"
                        >
                            Create your account
                        </Link>
                    </div>
                </section>

                <footer className="border-t border-[#D9E3D3] py-8">
                    <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 text-xs text-[#5B6B5D]">
                        <div className="flex items-center gap-2">
                            <LogoMark size="h-4 w-4" />
                            <span>Bible Tracker</span>
                        </div>
                        <span>Built to be read, not scrolled.</span>
                    </div>
                </footer>
            </div>
        </>
    );
}