import { Head, usePage } from '@inertiajs/react';
import { useState } from 'react';
import DownloadChapter from '@/components/download-chapter';
import OfflineLibrary from '@/components/offline-library';
import type { BibleBook } from '@/components/log-reading-form';
import { Label } from '@/components/ui/label';
import type { Auth } from '@/types';
export default function Downloads({ books }: { books: BibleBook[] }) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const [book, setBook] = useState(books[0]?.id ?? 'GEN');
    const [chapter, setChapter] = useState(1);
    const input =
        'min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm';
    return (
        <>
            <Head title="Downloads" />
            <main className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
                <header className="space-y-2">
                    <p className="text-primary text-sm font-medium">
                        Scripture, ready for the journey
                    </p>
                    <h1 className="text-3xl font-semibold tracking-tight">
                        Downloads
                    </h1>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Choose individual WEB chapters to keep on this browser.
                        Downloads stay on this device and do not move between
                        devices with your account.
                    </p>
                </header>
                <section className="bg-card space-y-4 rounded-xl border p-5 shadow-sm sm:p-6">
                    <h2 className="text-lg font-semibold">
                        Download a chapter
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        World English Bible text is public domain. Downloads are
                        limited to 50 chapters or 10 MB per device. Choose one
                        chapter at a time.
                    </p>
                    <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
                        <div className="space-y-2">
                            <Label htmlFor="download-book">Book</Label>
                            <select
                                id="download-book"
                                className={input}
                                value={book}
                                onChange={(event) => {
                                    setBook(event.target.value);
                                    setChapter(1);
                                }}
                            >
                                {books.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="download-chapter">Chapter</Label>
                            <input
                                id="download-chapter"
                                type="number"
                                className={input}
                                min={1}
                                max={
                                    books.find((item) => item.id === book)
                                        ?.chapters ?? 150
                                }
                                value={chapter}
                                onChange={(event) =>
                                    setChapter(Number(event.target.value))
                                }
                            />
                        </div>
                    </div>
                    <DownloadChapter
                        key={`${book}:${chapter}`}
                        bookId={book}
                        chapter={chapter}
                    />
                    <p className="text-muted-foreground text-xs">
                        Keep this tab connected until the download is confirmed.{' '}
                        <a
                            href="https://www.ebible.org/eng-web/copyright.htm"
                            className="underline"
                        >
                            WEB permissions
                        </a>
                    </p>
                </section>
                <OfflineLibrary ownerId={auth.user.id} />
            </main>
        </>
    );
}
