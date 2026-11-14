import { Link, useForm } from '@inertiajs/react';
import { type FormEventHandler } from 'react';
import { show } from '@/actions/App/Http/Controllers/BibleController';
import { store } from '@/actions/App/Http/Controllers/ReadingEntryController';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';

export interface BibleBook {
    id: string;
    name: string;
    chapters: number;
}

export default function LogReadingForm({ books }: { books: BibleBook[] }) {
    const {
        data,
        setData,
        post,
        processing,
        errors,
        reset,
        recentlySuccessful,
    } = useForm({ book: '', chapter: '', note: '' });
    const selectedBook = books.find((book) => book.name === data.book);
    const validChapter = Boolean(
        selectedBook &&
        Number.isInteger(Number(data.chapter)) &&
        Number(data.chapter) >= 1 &&
        Number(data.chapter) <= selectedBook.chapters,
    );
    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        post(store.url(), {
            preserveScroll: true,
            onSuccess: () => reset('chapter', 'note'),
        });
    };
    return (
        <form
            onSubmit={submit}
            className="bg-card rounded-xl border p-5 shadow-sm sm:p-6"
        >
            <h2 className="text-lg font-semibold">Log today's reading</h2>
            <p className="text-muted-foreground mt-1 text-sm">
                A chapter read, a thought worth keeping.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="book">Book</Label>
                    <select
                        id="book"
                        required
                        value={data.book}
                        onChange={(event) => {
                            setData('book', event.target.value);
                            setData('chapter', '');
                        }}
                        className="border-input bg-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm focus-visible:ring-2"
                    >
                        <option value="">Select a book</option>
                        {books.map((book) => (
                            <option key={book.id} value={book.name}>
                                {book.name}
                            </option>
                        ))}
                    </select>
                    <InputError message={errors.book} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="chapter">Chapter</Label>
                    <Input
                        id="chapter"
                        type="number"
                        min={1}
                        max={selectedBook?.chapters}
                        required
                        disabled={!selectedBook}
                        placeholder={
                            selectedBook
                                ? `1 to ${selectedBook.chapters}`
                                : 'Choose a book first'
                        }
                        value={data.chapter}
                        onChange={(event) =>
                            setData('chapter', event.target.value)
                        }
                        className="h-10"
                    />
                    <InputError message={errors.chapter} />
                </div>
            </div>
            <div className="mt-4 space-y-2">
                <Label htmlFor="note">
                    Reflection{' '}
                    <span className="text-muted-foreground font-normal">
                        (optional)
                    </span>
                </Label>
                <textarea
                    id="note"
                    rows={3}
                    maxLength={1000}
                    placeholder="What stood out to you?"
                    value={data.note}
                    onChange={(event) => setData('note', event.target.value)}
                    className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                />
                <InputError message={errors.note} />
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3 border-t pt-4">
                <Button type="submit" disabled={processing || !validChapter}>
                    {processing ? 'Saving...' : 'Mark as read'}
                </Button>
                {selectedBook && validChapter && (
                    <Button asChild variant="ghost">
                        <Link
                            href={show.url({
                                bookId: selectedBook.id,
                                chapter: data.chapter,
                            })}
                        >
                            Read passage first
                        </Link>
                    </Button>
                )}
                <span role="status" className="text-primary text-sm">
                    {recentlySuccessful
                        ? 'Reading saved. Keep going at your own pace.'
                        : ''}
                </span>
            </div>
        </form>
    );
}
