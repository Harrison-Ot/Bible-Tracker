export default function ActionFeedback({
    feedback,
}: {
    feedback: { error: boolean; message: string } | null;
}) {
    if (!feedback) return null;
    return (
        <p
            role={feedback.error ? 'alert' : 'status'}
            className={`rounded-lg border px-4 py-3 text-sm break-words ${feedback.error ? 'border-red-500/30 bg-red-500/5 text-red-700 dark:text-red-400' : 'border-primary/20 bg-primary/5 text-primary'}`}
        >
            {feedback.message}
        </p>
    );
}
