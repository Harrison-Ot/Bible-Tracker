import { Form, Link } from '@inertiajs/react';
import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

export const groupInputClass =
    'min-h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
export const groupCardClass =
    'min-w-0 space-y-4 rounded-xl border bg-card p-5 shadow-sm sm:p-6';

export function GroupForm({
    url,
    method = 'post',
    children,
    label,
    disabled,
    onBusy,
    resetFields,
    destructive = false,
}: {
    url: string;
    method?: 'post' | 'patch' | 'delete';
    children: ReactNode;
    label: string;
    disabled: boolean;
    onBusy: (busy: boolean) => void;
    resetFields?: string[];
    destructive?: boolean;
}) {
    const [failure, setFailure] = useState('');
    return (
        <Form
            action={url}
            method={method}
            options={{ preserveScroll: true, preserveState: true }}
            resetOnSuccess={resetFields}
            onStart={() => {
                setFailure('');
                onBusy(true);
            }}
            onFinish={() => onBusy(false)}
            onNetworkError={() => {
                setFailure(
                    'Could not connect. Your draft is kept here. Check your connection and try again.',
                );
                return false;
            }}
            onHttpException={(response) => {
                setFailure(
                    response.status === 419
                        ? 'Your session expired. Refresh the page before trying again.'
                        : 'This action could not be completed. Refresh the page and try again.',
                );
                return false;
            }}
        >
            {({ processing, errors, recentlySuccessful }) => (
                <fieldset
                    disabled={disabled || processing}
                    className="min-w-0 space-y-4"
                >
                    {children}
                    {Object.keys(errors).length > 0 && (
                        <p role="alert" className="text-destructive text-sm">
                            {Object.values(errors).join(' ')}
                        </p>
                    )}
                    {failure && (
                        <p role="alert" className="text-destructive text-sm">
                            {failure}
                        </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3">
                        <Button
                            type="submit"
                            variant={destructive ? 'destructive' : 'default'}
                        >
                            {processing ? 'Saving...' : label}
                        </Button>
                        <span
                            role="status"
                            className="text-muted-foreground text-sm"
                        >
                            {recentlySuccessful ? 'Saved.' : ''}
                        </span>
                    </div>
                </fieldset>
            )}
        </Form>
    );
}

export function GroupPagination({
    page,
    label,
}: {
    page: { prev_page_url: string | null; next_page_url: string | null };
    label: string;
}) {

    if (!page.prev_page_url && !page.next_page_url) return null;
    return (
        <nav
            aria-label={label}
            className="text-primary flex flex-wrap gap-4 text-sm font-medium"
        >
            {page.prev_page_url && (
                <Link
                    href={page.prev_page_url}
                    preserveState
                    preserveScroll
                    className="hover:underline"
                >
                    Previous
                </Link>
            )}
            {page.next_page_url && (
                <Link
                    href={page.next_page_url}
                    preserveState
                    preserveScroll
                    className="hover:underline"
                >
                    Next
                </Link>
            )}
        </nav>
    );
}
