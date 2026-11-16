import { Head, Link } from '@inertiajs/react';
import { BookOpen, Check, Pause, Play, Plus, RotateCw } from 'lucide-react';
import { useState } from 'react';
import ReadingDays, { readingDayNames } from '@/components/reading-days';
import ActionFeedback from '@/components/action-feedback';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useActionRequest } from '@/hooks/use-action-request';
type Plan = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    isCustom: boolean;
    durationDays: number;
    currentDay: number | null;
    startedOn: string | null;
    isComplete: boolean;
    isPaused: boolean;
    readingDays: number[];
    nextReadOn: string | null;
    isOverdue: boolean;
    todayReadings: { reference: string; url: string; isRead: boolean }[];
    isTodayComplete: boolean;
};
const descriptions: Record<string, string> = {
    blueprint: 'A complete journey from Genesis through Revelation.',
    'new-testament-challenge':
        'Follow Jesus and the growth of the early church.',
    'gospels-only': 'Meet Jesus in Matthew, Mark, Luke, and John.',
    'wisdom-literature':
        'Spend time with the prayers, poetry, and wisdom of Scripture.',
};
function ScheduleEditor({
    plan,
    today,
    disabled,
    save,
}: {
    plan: Plan;
    today: string;
    disabled: boolean;
    save: (days: number[], date: string) => void;
}) {
    const [days, setDays] = useState(plan.readingDays);
    const [date, setDate] = useState(
        plan.nextReadOn && plan.nextReadOn >= today ? plan.nextReadOn : today,
    );
    return (
        <details className="rounded-lg border p-3">
            <summary className="focus-visible:ring-ring cursor-pointer rounded-sm text-sm font-medium focus-visible:ring-2">
                Adjust remaining schedule
            </summary>
            <form
                className="mt-4 space-y-4"
                onSubmit={(event) => {
                    event.preventDefault();
                    save(days, date);
                }}
            >
                <ReadingDays
                    id={`schedule-${plan.id}`}
                    value={days}
                    disabled={disabled}
                    onChange={(day, checked) =>
                        setDays((previous) =>
                            checked
                                ? [...previous, day].sort((a, b) => a - b)
                                : previous.filter((value) => value !== day),
                        )
                    }
                />
                <div className="space-y-2">
                    <Label htmlFor={`schedule-date-${plan.id}`}>
                        Schedule from
                    </Label>
                    <Input
                        id={`schedule-date-${plan.id}`}
                        type="date"
                        min={today}
                        required
                        value={date}
                        disabled={disabled}
                        onChange={(event) => setDate(event.target.value)}
                    />
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">
                    Moves the next unfinished reading to a selected weekday on
                    or after this date. Completed readings stay complete.
                </p>
                <Button
                    size="sm"
                    variant="outline"
                    disabled={disabled || !days.length}
                >
                    Save schedule
                </Button>
            </form>
        </details>
    );
}
export default function ReadingPlansIndex({
    plans,
    today,
    errors,
}: {
    plans: Plan[];
    today: string;
    errors?: { readingPlan?: string };
}) {
    const { pending, feedback, submit } = useActionRequest();
    const action = (plan: Plan, suffix: string, message: string) =>
        submit(
            `plan-${plan.id}`,
            'post',
            `/reading-plans/${plan.id}/${suffix}`,
            plan.currentDay ? { expected_day: plan.currentDay } : {},
            message,
        );
    return (
        <>
            <Head title="Reading plans" />
            <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
                <header className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-primary mb-1 text-sm font-medium">
                            A rhythm for the Word
                        </p>
                        <h1 className="text-3xl font-semibold tracking-tight">
                            Your reading plans
                        </h1>
                        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
                            Choose a guided journey or create a private plan.
                            Readings logged since a plan started count toward
                            its next passages.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline">
                            <Link href="/reports">View progress</Link>
                        </Button>
                        <Button asChild>
                            <Link href="/reading-plans/create">
                                <Plus aria-hidden="true" />
                                Create a plan
                            </Link>
                        </Button>
                    </div>
                </header>
                <ActionFeedback
                    feedback={
                        pending
                            ? { error: false, message: 'Updating your plan...' }
                            : (feedback ??
                              (errors?.readingPlan
                                  ? { error: true, message: errors.readingPlan }
                                  : null))
                    }
                />
                {plans.length ? (
                    <section
                        aria-label="Reading plans"
                        className="grid items-start gap-5 lg:grid-cols-2"
                    >
                        {plans.map((plan) => {
                            const done = plan.currentDay
                                ? Math.min(
                                      plan.currentDay - 1,
                                      plan.durationDays,
                                  )
                                : 0;
                            const percent = Math.round(
                                (done / plan.durationDays) * 100,
                            );
                            const active =
                                plan.currentDay !== null && !plan.isComplete;
                            return (
                                <article
                                    key={plan.id}
                                    className="bg-card space-y-5 rounded-xl border p-5 shadow-sm sm:p-6"
                                >
                                    <div>
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <h2 className="max-w-full min-w-0 text-xl font-semibold break-words">
                                                {plan.name}
                                            </h2>
                                            <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium">
                                                {plan.isComplete
                                                    ? 'Completed'
                                                    : plan.isPaused
                                                      ? 'Paused'
                                                      : plan.isCustom
                                                        ? 'Your private plan'
                                                        : 'Guided plan'}
                                            </span>
                                        </div>
                                        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                                            {plan.description ||
                                                descriptions[plan.slug] ||
                                                'A guided journey through Scripture.'}
                                        </p>
                                        <p className="text-muted-foreground mt-3 text-xs">
                                            {plan.durationDays} readings ·{' '}
                                            {plan.readingDays.length === 7
                                                ? 'Daily'
                                                : plan.readingDays
                                                      .map((day) =>
                                                          readingDayNames[
                                                              day
                                                          ].slice(0, 3),
                                                      )
                                                      .join(', ')}
                                        </p>
                                    </div>
                                    {plan.currentDay !== null && (
                                        <div className="space-y-2">
                                            <div className="flex flex-wrap justify-between gap-2 text-sm">
                                                <span>
                                                    {done} of{' '}
                                                    {plan.durationDays} readings
                                                    completed
                                                </span>
                                                <span className="text-muted-foreground">
                                                    {percent}%
                                                </span>
                                            </div>
                                            <progress
                                                value={done}
                                                max={plan.durationDays}
                                                aria-label={`${plan.name} completed readings`}
                                                className="[&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-primary h-2 w-full overflow-hidden rounded-full"
                                            />
                                        </div>
                                    )}
                                    {plan.isComplete && (
                                        <p
                                            role="status"
                                            className="bg-primary/10 text-primary rounded-lg p-4 text-sm font-medium"
                                        >
                                            Congratulations! You finished this
                                            journey. Your completed readings are
                                            saved.
                                        </p>
                                    )}
                                    {active && (
                                        <>
                                            <div className="bg-muted/50 space-y-3 rounded-lg p-4">
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <h3 className="font-medium">
                                                        Reading{' '}
                                                        {plan.currentDay}: next
                                                        passages
                                                    </h3>
                                                    <span className="text-muted-foreground text-xs">
                                                        {plan.isPaused
                                                            ? 'Schedule on hold'
                                                            : plan.nextReadOn
                                                              ? `Suggested ${plan.nextReadOn}`
                                                              : 'At your pace'}
                                                    </span>
                                                </div>
                                                {plan.isOverdue && (
                                                    <p className="text-muted-foreground text-xs">
                                                        Ready to catch up?
                                                        Already logged passages
                                                        can be credited below,
                                                        or adjust the remaining
                                                        schedule.
                                                    </p>
                                                )}
                                                <ul className="space-y-2">
                                                    {plan.todayReadings.map(
                                                        (reading) => (
                                                            <li
                                                                key={
                                                                    reading.reference
                                                                }
                                                                className="flex flex-wrap items-center gap-2 text-sm"
                                                            >
                                                                <Link
                                                                    href={
                                                                        reading.url
                                                                    }
                                                                    className="text-primary inline-flex items-center gap-2 font-medium hover:underline"
                                                                >
                                                                    {reading.isRead ? (
                                                                        <Check
                                                                            className="size-4"
                                                                            aria-hidden="true"
                                                                        />
                                                                    ) : (
                                                                        <BookOpen
                                                                            className="size-4"
                                                                            aria-hidden="true"
                                                                        />
                                                                    )}
                                                                    {
                                                                        reading.reference
                                                                    }
                                                                </Link>
                                                                {reading.isRead && (
                                                                    <span className="text-muted-foreground text-xs">
                                                                        Logged
                                                                    </span>
                                                                )}
                                                            </li>
                                                        ),
                                                    )}
                                                </ul>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {plan.isPaused ? (
                                                    <Button
                                                        disabled={
                                                            pending !== null
                                                        }
                                                        onClick={() =>
                                                            action(
                                                                plan,
                                                                'resume',
                                                                'Plan resumed. Your completed readings are kept.',
                                                            )
                                                        }
                                                    >
                                                        <Play aria-hidden="true" />
                                                        Resume plan
                                                    </Button>
                                                ) : (
                                                    <>
                                                        <Button
                                                            disabled={
                                                                pending !==
                                                                    null ||
                                                                !plan.isTodayComplete
                                                            }
                                                            onClick={() =>
                                                                action(
                                                                    plan,
                                                                    'complete-day',
                                                                    'Reading progress updated.',
                                                                )
                                                            }
                                                        >
                                                            <Check aria-hidden="true" />
                                                            {pending ===
                                                            `plan-${plan.id}`
                                                                ? 'Updating...'
                                                                : 'Complete reading'}
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            disabled={
                                                                pending !== null
                                                            }
                                                            onClick={() =>
                                                                action(
                                                                    plan,
                                                                    'pause',
                                                                    'Plan paused. Your reading position is saved.',
                                                                )
                                                            }
                                                        >
                                                            <Pause aria-hidden="true" />
                                                            Pause
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-auto min-h-9 whitespace-normal"
                                                            disabled={
                                                                pending !==
                                                                    null ||
                                                                !plan.isTodayComplete
                                                            }
                                                            onClick={() =>
                                                                action(
                                                                    plan,
                                                                    'catch-up',
                                                                    'Logged readings credited. Catch-up stops at the first unfinished reading.',
                                                                )
                                                            }
                                                        >
                                                            <RotateCw aria-hidden="true" />
                                                            Catch up logged
                                                            readings
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                            {!plan.isTodayComplete &&
                                                !plan.isPaused && (
                                                    <p className="text-muted-foreground text-xs">
                                                        Log all next passages to
                                                        complete this reading.
                                                        Catch-up credits
                                                        consecutive readings
                                                        already in your journal.
                                                    </p>
                                                )}
                                            <ScheduleEditor
                                                key={`${plan.id}:${plan.nextReadOn}:${plan.readingDays.join(',')}`}
                                                plan={plan}
                                                today={today}
                                                disabled={pending !== null}
                                                save={(days, date) =>
                                                    submit(
                                                        `plan-${plan.id}`,
                                                        'patch',
                                                        `/reading-plans/${plan.id}/schedule`,
                                                        {
                                                            reading_days: days,
                                                            next_read_on: date,
                                                        },
                                                        'Remaining schedule updated. Completed readings are kept.',
                                                    )
                                                }
                                            />
                                        </>
                                    )}
                                    {plan.currentDay === null && (
                                        <Button
                                            className="w-full"
                                            disabled={pending !== null}
                                            onClick={() =>
                                                action(
                                                    plan,
                                                    'start',
                                                    'Reading plan started.',
                                                )
                                            }
                                        >
                                            <BookOpen aria-hidden="true" />
                                            {pending === `plan-${plan.id}`
                                                ? 'Starting...'
                                                : 'Start this plan'}
                                        </Button>
                                    )}
                                </article>
                            );
                        })}
                    </section>
                ) : (
                    <section className="bg-card rounded-xl border p-8 text-center">
                        <h2 className="font-semibold">
                            Create your own reading journey
                        </h2>
                        <p className="text-muted-foreground mt-2 text-sm">
                            Your personal plan can cover any consecutive range
                            of Bible books.
                        </p>
                        <Button asChild className="mt-4">
                            <Link href="/reading-plans/create">
                                Create a plan
                            </Link>
                        </Button>
                    </section>
                )}
            </main>
        </>
    );
}
ReadingPlansIndex.layout = {
    breadcrumbs: [{ title: 'Reading plans', href: '/reading-plans' }],
};
