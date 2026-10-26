import { Head, router } from '@inertiajs/react';
import { BookOpen, BookOpenCheck, CalendarDays, Check, Clock3, Sparkles } from 'lucide-react';
import { store as startReadingPlan } from '@/actions/App/Http/Controllers/ReadingPlanController';
import { index as readingPlansIndex } from '@/actions/App/Http/Controllers/ReadingPlanController';
import { completeDay as completeReadingPlanDay } from '@/actions/App/Http/Controllers/ReadingPlanController';
import { dashboard } from '@/routes';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

type Plan = {
    id: number;
    name: string;
    slug: string;
    durationDays: number;
    currentDay: number | null;
    startedOn: string | null;
    isComplete: boolean;
    todayReadings: { book: string; chapters: string }[];
};

const planDetails: Record<string, { content: string; idealFor: string; description: string; accent: string }> = {
    blueprint: {
        content: 'Genesis through Revelation',
        idealFor: 'Long-term daily discipline',
        description: 'A complete journey through every book of the Bible.',
        accent: 'from-emerald-700 to-green-600',
    },
    'new-testament-challenge': {
        content: 'Matthew through Revelation',
        idealFor: 'Medium-term focus',
        description: 'Follow the life of Jesus and the growth of the early church.',
        accent: 'from-sky-700 to-teal-600',
    },
    'gospels-only': {
        content: 'Matthew, Mark, Luke, and John',
        idealFor: 'Quick start / Beginners',
        description: 'Get to know Jesus through the four Gospel accounts.',
        accent: 'from-amber-700 to-orange-600',
    },
    'wisdom-literature': {
        content: 'Psalms, Proverbs, and Ecclesiastes',
        idealFor: 'Devotional reflection',
        description: 'Spend time with Scripture’s prayers, poetry, and wisdom.',
        accent: 'from-violet-700 to-indigo-600',
    },
};

export default function ReadingPlansIndex({ plans }: { plans: Plan[] }) {
    const [processingPlanId, setProcessingPlanId] = useState<number | null>(null);

    const submitPlanAction = (plan: Plan) => {
        const action = plan.currentDay && !plan.isComplete
            ? completeReadingPlanDay(plan.id)
            : startReadingPlan(plan.id);

        router.post(action.url, {}, {
            onStart: () => setProcessingPlanId(plan.id),
            onFinish: () => setProcessingPlanId(null),
        });
    };

    return (
        <>
            <Head title="Reading Plans" />
            <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-4 md:p-8">
                <header className="space-y-3">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">A rhythm for the Word</p>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Choose your reading plan</h1>
                            <p className="max-w-2xl text-muted-foreground">Choose a pace that fits your season. You can start a plan now and return to it anytime.</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <BookOpenCheck className="size-4 text-primary" />
                            Four guided journeys
                        </div>
                    </div>
                </header>

                {plans.length ? (
                    <section className="grid gap-5 md:grid-cols-2">
                        {plans.map((plan) => {
                            const details = planDetails[plan.slug] ?? {
                                content: 'A guided journey through Scripture',
                                idealFor: 'Building a daily habit',
                                description: 'A day-by-day reading journey through the Bible.',
                                accent: 'from-emerald-700 to-green-600',
                            };
                            const progressPercent = plan.currentDay
                                ? Math.min(Math.round(((plan.currentDay - 1) / plan.durationDays) * 100), 100)
                                : 0;

                            return (
                                <Card key={plan.id} className="overflow-hidden border-border/70 shadow-sm">
                                    <div className={`h-2 bg-gradient-to-r ${details.accent}`} />
                                    <CardHeader className="gap-3 pb-3">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="space-y-2">
                                                <CardTitle className="text-xl">{plan.name}</CardTitle>
                                                <CardDescription>{details.description}</CardDescription>
                                            </div>
                                            <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                                                {plan.durationDays} days
                                            </span>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div className="rounded-lg bg-muted/60 p-3">
                                                <p className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground"><BookOpen className="size-3.5" /> Reading</p>
                                                <p className="text-sm font-semibold">{details.content}</p>
                                            </div>
                                            <div className="rounded-lg bg-muted/60 p-3">
                                                <p className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground"><Sparkles className="size-3.5" /> Ideal for</p>
                                                <p className="text-sm font-semibold">{details.idealFor}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                                            <span className="inline-flex items-center gap-2"><CalendarDays className="size-4" /> {plan.durationDays} day plan</span>
                                            <span className="inline-flex items-center gap-2"><Clock3 className="size-4" /> {plan.durationDays} daily readings</span>
                                        </div>
                                        {plan.currentDay && !plan.isComplete && (
                                            <div className="rounded-lg border border-primary/15 bg-primary/[0.04] p-4">
                                                <p className="mb-2 text-sm font-semibold">Today’s reading</p>
                                                <ul className="space-y-1 text-sm text-muted-foreground">
                                                    {plan.todayReadings.map((reading) => (
                                                        <li key={`${reading.book}-${reading.chapters}`}>
                                                            {reading.book} {reading.chapters}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {plan.isComplete && (
                                            <p className="rounded-lg bg-primary/10 p-3 text-sm font-semibold text-primary">
                                                Congratulations — you completed this plan!
                                            </p>
                                        )}
                                        {plan.currentDay && (
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="font-medium">Day {Math.min(plan.currentDay, plan.durationDays)} of {plan.durationDays}</span>
                                                    <span className="text-muted-foreground">{progressPercent}%</span>
                                                </div>
                                                <div className="h-2 overflow-hidden rounded-full bg-muted">
                                                    <div className={`h-full rounded-full bg-gradient-to-r ${details.accent}`} style={{ width: `${progressPercent}%` }} />
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                    <CardFooter>
                                        <Button
                                            className="w-full"
                                            disabled={processingPlanId === plan.id || plan.isComplete}
                                            variant={plan.currentDay ? 'secondary' : 'default'}
                                            onClick={() => submitPlanAction(plan)}
                                        >
                                            {plan.currentDay ? <Check /> : <BookOpenCheck />}
                                            {processingPlanId === plan.id
                                                ? 'Saving…'
                                                : plan.isComplete
                                                  ? 'Plan completed'
                                                  : plan.currentDay
                                                    ? 'Complete today & continue'
                                                    : 'Start this plan'}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            );
                        })}
                    </section>
                ) : (
                    <Card>
                        <CardContent className="py-16 text-center text-muted-foreground">
                            Reading plans are being prepared. Please check back soon.
                        </CardContent>
                    </Card>
                )}
            </main>
        </>
    );
}

ReadingPlansIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Reading Plans', href: readingPlansIndex() },
    ],
};