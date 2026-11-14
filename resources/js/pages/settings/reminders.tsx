import { Head, useForm } from '@inertiajs/react';
import { Bell, Clock3, Globe2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import Heading from '@/components/heading';
import { useState } from 'react';

type Reminder = {
    enabled: boolean;
    time: string;
    timezone: string;
    days: number[];
};
const weekdays = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
];

export default function ReminderSettings({
    reminder,
    timezones,
}: {
    reminder: Reminder;
    timezones: string[];
}) {
    const { data, setData, patch, processing, errors, recentlySuccessful } =
        useForm<Reminder>(reminder);
    const [deviceMessage, setDeviceMessage] = useState('');
    const dayErrors = Object.entries(errors)
        .filter(([field]) => field === 'days' || field.startsWith('days.'))
        .map(([, message]) => message)
        .join(' ');
    const useDeviceTimezone = () => {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (timezones.includes(timezone)) {
            setData('timezone', timezone);
            setDeviceMessage(`Selected ${timezone}. Save to apply it.`);
        } else setDeviceMessage('Choose your timezone from the list.');
    };

    return (
        <>
            <Head title="Reading reminders" />
            <h1 className="sr-only">Reading reminders</h1>
            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Reading reminders"
                    description="Choose a gentle nudge to make time for Scripture."
                />
                <form
                    className="space-y-6"
                    onSubmit={(event) => {
                        event.preventDefault();
                        patch('/settings/reminders', { preserveScroll: true });
                    }}
                >
                    <div className="bg-card flex items-start gap-3 rounded-xl border p-4">
                        <Checkbox
                            id="reminders-enabled"
                            checked={data.enabled}
                            disabled={processing}
                            onCheckedChange={(checked) =>
                                setData('enabled', checked === true)
                            }
                            className="mt-1"
                        />
                        <div className="space-y-1">
                            <Label htmlFor="reminders-enabled">
                                Email me reading reminders
                            </Label>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                Receive one email on your chosen days. Turn this
                                off and save at any time, or use the unsubscribe
                                link in a reminder.
                            </p>
                        </div>
                    </div>
                    <InputError message={errors.enabled} />
                    <fieldset
                        disabled={!data.enabled || processing}
                        className="space-y-5 disabled:opacity-60"
                    >
                        <legend className="mb-4 font-medium">
                            Your reading rhythm
                        </legend>
                        <div className="space-y-2">
                            <Label htmlFor="reminder-time">
                                <Clock3 className="size-4" aria-hidden="true" />
                                Reminder time
                            </Label>
                            <Input
                                id="reminder-time"
                                type="time"
                                required
                                value={data.time}
                                onChange={(event) =>
                                    setData('time', event.target.value)
                                }
                                aria-invalid={Boolean(errors.time)}
                                aria-describedby={
                                    errors.time
                                        ? 'reminder-time-error'
                                        : undefined
                                }
                                className="max-w-48"
                            />
                            <InputError
                                id="reminder-time-error"
                                message={errors.time}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="reminder-timezone">
                                <Globe2 className="size-4" aria-hidden="true" />
                                Timezone
                            </Label>
                            <select
                                id="reminder-timezone"
                                value={data.timezone}
                                onChange={(event) => {
                                    setData('timezone', event.target.value);
                                    setDeviceMessage('');
                                }}
                                aria-invalid={Boolean(errors.timezone)}
                                aria-describedby={
                                    errors.timezone
                                        ? 'reminder-timezone-error'
                                        : 'timezone-help'
                                }
                                className="border-input bg-background focus-visible:ring-ring h-10 w-full min-w-0 rounded-md border px-3 text-sm focus-visible:ring-2"
                            >
                                <option value="UTC">UTC</option>
                                {timezones
                                    .filter((zone) => zone !== 'UTC')
                                    .map((zone) => (
                                        <option key={zone} value={zone}>
                                            {zone.replaceAll('_', ' ')}
                                        </option>
                                    ))}
                            </select>
                            <p
                                id="timezone-help"
                                className="text-muted-foreground text-xs"
                            >
                                The time and reading days follow this timezone.
                            </p>
                            <InputError
                                id="reminder-timezone-error"
                                message={errors.timezone}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={useDeviceTimezone}
                            >
                                Use my device timezone
                            </Button>
                            <p
                                role="status"
                                className="text-muted-foreground text-xs"
                            >
                                {deviceMessage}
                            </p>
                        </div>
                        <fieldset
                            aria-describedby={
                                dayErrors ? 'reminder-days-error' : undefined
                            }
                        >
                            <legend className="mb-3 text-sm font-medium">
                                Reading days
                            </legend>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                {weekdays.map((day, index) => (
                                    <label
                                        key={day}
                                        htmlFor={`reminder-day-${index}`}
                                        className="bg-card flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-3 text-sm"
                                    >
                                        <Checkbox
                                            id={`reminder-day-${index}`}
                                            checked={data.days.includes(index)}
                                            onCheckedChange={(checked) =>
                                                setData((previous) => ({
                                                    ...previous,
                                                    days:
                                                        checked === true
                                                            ? [
                                                                  ...previous.days,
                                                                  index,
                                                              ].sort(
                                                                  (
                                                                      left,
                                                                      right,
                                                                  ) =>
                                                                      left -
                                                                      right,
                                                              )
                                                            : previous.days.filter(
                                                                  (value) =>
                                                                      value !==
                                                                      index,
                                                              ),
                                                }))
                                            }
                                        />
                                        {day}
                                    </label>
                                ))}
                            </div>
                            <InputError
                                id="reminder-days-error"
                                message={dayErrors}
                                className="mt-2"
                            />
                        </fieldset>
                    </fieldset>
                    <div className="border-primary/20 bg-primary/5 rounded-xl border p-4 text-sm">
                        <p className="flex items-center gap-2 font-medium">
                            <Bell
                                className="text-primary size-4"
                                aria-hidden="true"
                            />
                            Schedule preview
                        </p>
                        <p className="text-muted-foreground mt-2 leading-relaxed">
                            {data.enabled
                                ? `${data.days.length ? weekdays.filter((_, index) => data.days.includes(index)).join(', ') : 'Choose at least one day'} at ${data.time || '--:--'} (${data.timezone}).`
                                : 'Email reminders are off.'}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Button disabled={processing}>
                            {processing ? 'Saving...' : 'Save reminders'}
                        </Button>
                        <p role="status" className="text-primary text-sm">
                            {recentlySuccessful
                                ? 'Reminder preferences saved.'
                                : ''}
                        </p>
                    </div>
                </form>
            </div>
        </>
    );
}

ReminderSettings.layout = {
    breadcrumbs: [{ title: 'Reading reminders', href: '/settings/reminders' }],
};
