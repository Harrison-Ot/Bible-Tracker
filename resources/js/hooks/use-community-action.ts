import { router } from '@inertiajs/react';
import { useRef, useState } from 'react';

export function useCommunityAction() {
    const locked = useRef(false);
    const [pending, setPending] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{
        error: boolean;
        message: string;
    } | null>(null);

    const submit = (
        key: string,
        method: 'post' | 'patch',
        url: string,
        data: Record<string, string>,
        successMessage: string,
    ) => {
        if (locked.current) return;
        locked.current = true;
        setPending(key);
        setFeedback(null);
        router.visit(url, {
            method,
            data,
            preserveScroll: true,
            preserveState: true,
            onSuccess: () =>
                setFeedback({ error: false, message: successMessage }),
            onError: (errors) =>
                setFeedback({
                    error: true,
                    message: Object.values(errors).join(' '),
                }),
            onHttpException: (response) => {
                setFeedback({
                    error: true,
                    message:
                        response.status === 419
                            ? 'Your session expired. Refresh the page and try again.'
                            : 'This action could not be completed. Refresh the page and try again.',
                });
                return false;
            },
            onNetworkError: () => {
                setFeedback({
                    error: true,
                    message:
                        'Could not connect. Check your connection before trying again.',
                });
                return false;
            },
            onFinish: () => {
                locked.current = false;
                setPending(null);
            },
        });
    };
    return { pending, feedback, submit };
}
