import { useState } from 'react';
import { Award, ChevronDown, ChevronUp } from 'lucide-react';

export interface EarnedBadge {
    key: string;
    name: string;
    description: string;
    icon: string;
    earnedAt: string;
}

export default function EarnedBadges({ badges }: { badges: EarnedBadge[] }) {
    const [open, setOpen] = useState(false);
    return (
        <aside
            aria-label="Your earned badges"
            className="fixed right-4 bottom-[calc(var(--mobile-nav-height,0px)+1rem)] z-30 w-80 max-w-[calc(100vw-2rem)] sm:right-6 md:bottom-6"
        >
            {open && (
                <section
                    id="earned-badge-collection"
                    aria-labelledby="earned-badge-heading"
                    className="bg-card mb-3 max-h-[55svh] overflow-y-auto rounded-2xl border p-4 shadow-xl"
                >
                    <h2 id="earned-badge-heading" className="font-semibold">
                        Your badge collection
                    </h2>
                    <p className="text-muted-foreground mt-1 text-xs">
                        Milestones you have earned. Yours to keep.
                    </p>
                    {badges.length ? (
                        <ul className="mt-4 grid grid-cols-2 gap-3">
                            {badges.map((badge) => (
                                <li
                                    key={badge.key}
                                    className="bg-muted/40 flex flex-col items-center rounded-xl border p-3 text-center"
                                >
                                    <img
                                        src={badge.icon}
                                        alt=""
                                        className="h-24 w-24 object-contain"
                                    />
                                    <h3 className="mt-1 text-xs font-semibold">
                                        {badge.name}
                                    </h3>
                                    <p className="text-muted-foreground mt-1 text-xs">
                                        {badge.description}
                                    </p>
                                    <time
                                        dateTime={badge.earnedAt.replace(
                                            ' ',
                                            'T',
                                        )}
                                        className="text-muted-foreground mt-2 text-[10px]"
                                    >
                                        Earned {badge.earnedAt.slice(0, 10)}
                                    </time>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-muted-foreground mt-4 text-sm">
                            Log your first chapter to earn your first badge.
                        </p>
                    )}
                </section>
            )}
            <button
                type="button"
                onClick={() => setOpen(!open)}
                aria-expanded={open}
                aria-controls="earned-badge-collection"
                className="bg-card/95 focus-visible:ring-ring flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left shadow-lg backdrop-blur focus-visible:ring-2 focus-visible:outline-none"
            >
                <Award
                    className="text-primary size-5 shrink-0"
                    aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">
                        Your badges{' '}
                        <span className="text-primary">{badges.length}</span>
                    </span>
                    <span className="text-muted-foreground text-xs">
                        {open ? 'Hide collection' : 'View collection'}
                    </span>
                </span>
                <span className="flex -space-x-3" aria-hidden="true">
                    {badges.slice(0, 3).map((badge) => (
                        <img
                            key={badge.key}
                            src={badge.icon}
                            alt=""
                            className="h-12 w-11 object-contain"
                        />
                    ))}
                </span>
                {open ? (
                    <ChevronDown
                        className="size-4 shrink-0"
                        aria-hidden="true"
                    />
                ) : (
                    <ChevronUp className="size-4 shrink-0" aria-hidden="true" />
                )}
            </button>
        </aside>
    );
}
