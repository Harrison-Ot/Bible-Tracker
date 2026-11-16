import { Download, Check } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useOfflineStorage } from '@/hooks/use-offline-storage';
import { saveChapter, type OfflineChapter } from '@/lib/offline-db';
import { offlineRequest, prepareOfflineReader } from '@/lib/offline-sync';
export default function DownloadChapter({
    bookId,
    chapter,
    translation = 'web',
}: {
    bookId: string;
    chapter: number;
    translation?: string;
}) {
    const { chapters, error } = useOfflineStorage();
    const [busy, setBusy] = useState(false);
    const lock = useRef(false);
    const [feedback, setFeedback] = useState<{
        error: boolean;
        message: string;
    } | null>(null);
    const downloaded = chapters.some(
        (item) => item.bookId === bookId && item.chapter === chapter,
    );
    const download = async () => {
        if (lock.current) return;
        lock.current = true;
        setBusy(true);
        setFeedback(null);
        try {
            await prepareOfflineReader();
            const result = await offlineRequest<OfflineChapter>(
                `/offline-passages/${bookId}/${chapter}?translation=web`,
            );
            await saveChapter(result);
            setFeedback({
                error: false,
                message:
                    'Downloaded on this device. Open Downloads to read without a connection.',
            });
        } catch (failure) {
            setFeedback({
                error: true,
                message:
                    failure instanceof Error
                        ? failure.message
                        : 'Could not download. Try again while online.',
            });
        } finally {
            lock.current = false;
            setBusy(false);
        }
    };
    return (
        <div className="space-y-2 text-sm">
            <div className="flex flex-wrap items-center gap-3">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busy || translation !== 'web'}
                    onClick={() => void download()}
                >
                    {downloaded ? (
                        <Check aria-hidden="true" />
                    ) : (
                        <Download aria-hidden="true" />
                    )}
                    {busy
                        ? 'Preparing download...'
                        : downloaded
                          ? 'Download again'
                          : 'Download chapter'}
                </Button>
                {downloaded && translation === 'web' && (
                    <span className="text-primary">
                        Available offline · WEB
                    </span>
                )}
                <a
                    href="/offline"
                    className="text-primary font-medium hover:underline"
                >
                    Open offline reader
                </a>
            </div>
            {translation !== 'web' && (
                <p className="text-muted-foreground">
                    Offline downloads support the World English Bible (WEB).
                    Choose WEB to download this chapter.
                </p>
            )}
            {error && <p className="text-muted-foreground">{error}</p>}
            {feedback && (
                <p
                    role={feedback.error ? 'alert' : 'status'}
                    className={
                        feedback.error ? 'text-destructive' : 'text-primary'
                    }
                >
                    {feedback.message}
                </p>
            )}
        </div>
    );
}
