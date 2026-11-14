import { Head, Link, useForm } from '@inertiajs/react';
import { BellOff, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InputError from '@/components/input-error';

export default function ReminderUnsubscribe({
    unsubscribed,
    unsubscribeUrl,
}: {
    unsubscribed: boolean;
    unsubscribeUrl: string;
}) {
    const { post, processing, errors } = useForm({});
    return (
        <main className="bg-background text-foreground grid min-h-svh place-items-center px-4 py-10">
            <Head title="Stop reading reminders" />
            <section className="bg-card w-full max-w-md rounded-2xl border p-6 shadow-sm sm:p-8">
                <span className="bg-primary/10 text-primary mb-5 inline-flex rounded-xl p-3">
                    {unsubscribed ? (
                        <Check className="size-6" aria-hidden="true" />
                    ) : (
                        <BellOff className="size-6" aria-hidden="true" />
                    )}
                </span>
                <h1 className="text-2xl font-semibold tracking-tight">
                    {unsubscribed
                        ? 'Reading reminders are off'
                        : 'Stop reading reminders?'}
                </h1>
                <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                    {unsubscribed
                        ? 'You will no longer receive reading reminder emails. You can turn them on again in your reminder settings.'
                        : 'Confirm below to turn off reading reminder emails. Your reading history and plans will stay saved.'}
                </p>
                {!unsubscribed && (
                    <form
                        className="mt-6 space-y-3"
                        onSubmit={(event) => {
                            event.preventDefault();
                            post(unsubscribeUrl, { preserveScroll: true });
                        }}
                    >
                        <Button className="w-full" disabled={processing}>
                            {processing
                                ? 'Turning off...'
                                : 'Turn off reading reminders'}
                        </Button>
                        <InputError message={Object.values(errors).join(' ')} />
                    </form>
                )}
                <Button asChild variant="outline" className="mt-4 w-full">
                    <Link href="/">Go to Bible Tracker</Link>
                </Button>
            </section>
        </main>
    );
}
