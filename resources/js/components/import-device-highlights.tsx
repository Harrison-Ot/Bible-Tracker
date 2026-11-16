import { useEffect, useRef, useState } from 'react';
import {
    deviceHighlights,
    savedVerseRequest,
    type DeviceHighlightChapter,
} from '@/lib/saved-verses';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import ActionFeedback from '@/components/action-feedback';

export default function ImportDeviceHighlights({
    allowedBookIds,
    disabled,
    onBusy,
    onComplete,
}: {
    allowedBookIds: string[];
    disabled: boolean;
    onBusy: (busy: boolean) => void;
    onComplete: () => void;
}) {
    const [chapters, setChapters] = useState<DeviceHighlightChapter[]>([]);
    const [translation, setTranslation] = useState('web');
    const [busy, setBusy] = useState(false);
    const [feedback, setFeedback] = useState<{
        error: boolean;
        message: string;
    } | null>(null);
    const [progress, setProgress] = useState('');
    const alive = useRef(true);
    const running = useRef(false);
    const controller = useRef<AbortController | null>(null);
    useEffect(() => {
        alive.current = true;
        setChapters(
            deviceHighlights().filter((chapter) =>
                allowedBookIds.includes(chapter.bookId),
            ),
        );
        return () => {
            alive.current = false;
            controller.current?.abort();
        };
    }, [allowedBookIds]);
    const runImport = async () => {
        if (running.current || disabled) return;
        running.current = true;
        const abort = new AbortController();
        controller.current = abort;
        setBusy(true);
        onBusy(true);
        setFeedback(null);
        let imported = 0;
        let failed = 0;
        let failureReason = '';
        try {
            for (const [index, chapter] of chapters.entries()) {
                if (index > 0)
                    await new Promise((resolve) => setTimeout(resolve, 1050));
                if (!alive.current || abort.signal.aborted) break;
                setProgress(
                    `Importing chapter ${index + 1} of ${chapters.length}...`,
                );
                try {
                    const result = await savedVerseRequest<{
                        imported: number;
                    }>(
                        '/saved-verses/import',
                        'POST',
                        {
                            book_id: chapter.bookId,
                            chapter: chapter.chapter,
                            translation,
                            verses: chapter.verses,
                        },
                        abort.signal,
                    );
                    imported += result.imported;
                } catch (error) {
                    if (abort.signal.aborted) break;
                    failureReason ||=
                        error instanceof Error
                            ? error.message
                            : 'Could not import this chapter.';
                    failed++;
                }
            }
            if (alive.current && !abort.signal.aborted) {
                setFeedback({
                    error: failed > 0,
                    message: `${imported} new highlight${imported === 1 ? '' : 's'} imported.${failed ? ` ${failed} chapter${failed === 1 ? '' : 's'} could not be imported. ${failureReason} Try again; successful imports will not duplicate.` : ' Existing bookmarks are kept.'}`,
                });
                onComplete();
            }
        } finally {
            running.current = false;
            if (alive.current) {
                setBusy(false);
                onBusy(false);
                setProgress('');
            }
        }
    };
    if (!chapters.length) return null;
    return (
        <section
            className="border-primary/20 bg-primary/5 space-y-4 rounded-xl border p-5 sm:p-6"
            aria-labelledby="device-import-heading"
        >
            <div>
                <h2 id="device-import-heading" className="font-semibold">
                    Bring your device highlights with you
                </h2>
                <p className="text-muted-foreground mt-2 max-w-prose text-sm leading-relaxed">
                    Found highlights in {chapters.length}{' '}
                    {chapters.length === 1 ? 'chapter' : 'chapters'} on this
                    browser. Import only highlights you saved. Older highlights
                    have no translation, so choose one below. The originals stay
                    on this device.
                </p>
            </div>
            <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-2">
                    <Label htmlFor="import-translation">
                        Translation for these highlights
                    </Label>
                    <select
                        id="import-translation"
                        value={translation}
                        disabled={busy || disabled}
                        onChange={(event) => setTranslation(event.target.value)}
                        className="border-input bg-background focus-visible:ring-ring h-10 max-w-full rounded-md border px-3 text-sm focus-visible:ring-2"
                    >
                        <option value="web">World English Bible</option>
                        <option value="kjv">King James Version</option>
                    </select>
                </div>
                <Button
                    type="button"
                    disabled={busy || disabled}
                    onClick={runImport}
                >
                    {busy ? 'Importing...' : 'Import device highlights'}
                </Button>
            </div>
            <p role="status" className="text-muted-foreground text-sm">
                {progress}
            </p>
            <ActionFeedback feedback={feedback} />
        </section>
    );
}
