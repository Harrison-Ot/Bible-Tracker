import { Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { show } from '@/actions/App/Http/Controllers/BibleController';
import { store } from '@/actions/App/Http/Controllers/ReadingEntryController';

const BOOKS = [
    { name: 'Genesis', id: 'GEN' },
    { name: 'Exodus', id: 'EXO' },
    { name: 'Leviticus', id: 'LEV' },
    { name: 'Numbers', id: 'NUM' },
    { name: 'Deuteronomy', id: 'DEU' },
    { name: 'Matthew', id: 'MAT' },
    { name: 'Mark', id: 'MRK' },
    { name: 'Luke', id: 'LUK' },
    { name: 'John', id: 'JHN' },
    { name: 'Acts', id: 'ACT' },
    { name: 'Romans', id: 'ROM' },
    { name: 'Psalms', id: 'PSA' },
    { name: 'Proverbs', id: 'PRO' },
    // trim/extend this list as needed
];

export default function LogReadingForm() {
    const { data, setData, post, processing, errors, reset } = useForm({
        book: '',
        chapter: '',
        note: '',
    });
    const selectedBookId = BOOKS.find((book) => book.name === data.book)?.id;

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(store.url(), {
            preserveScroll: true,
            onSuccess: () => reset('chapter', 'note'),
        });
    };

    return (
        <form
            onSubmit={submit}
            className="rounded-xl border border-[#D9E3D3] bg-white p-6 shadow-sm"
        >
            <h3 className="text-base font-semibold text-[#16241A]">
                Log today's reading
            </h3>
            <p className="mt-1 text-sm text-[#5B6B5D]">
                Track what you've read and jot down any thoughts.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label htmlFor="book" className="block text-sm font-medium text-[#16241A]">
                        Book
                    </label>
                    <select
                        id="book"
                        value={data.book}
                        onChange={(e) => setData('book', e.target.value)}
                        className="mt-1.5 w-full rounded-md border border-[#B9C7B4] bg-white px-3 py-2 text-sm text-[#16241A] shadow-sm focus:border-[#2F6B3C] focus:outline-none focus:ring-2 focus:ring-[#2F6B3C]/30"
                    >
                        <option value="">Select a book</option>
                        {BOOKS.map((book) => (
                            <option key={book.id} value={book.name}>
                                {book.name}
                            </option>
                        ))}
                    </select>
                    {errors.book && (
                        <p className="mt-1 text-xs font-medium text-red-600">{errors.book}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="chapter" className="block text-sm font-medium text-[#16241A]">
                        Chapter
                    </label>
                    <input
                        id="chapter"
                        type="number"
                        min={1}
                        placeholder="e.g. 3"
                        value={data.chapter}
                        onChange={(e) => setData('chapter', e.target.value)}
                        className="mt-1.5 w-full rounded-md border border-[#B9C7B4] bg-white px-3 py-2 text-sm text-[#16241A] shadow-sm placeholder:text-[#9AAA96] focus:border-[#2F6B3C] focus:outline-none focus:ring-2 focus:ring-[#2F6B3C]/30"
                    />
                    {errors.chapter && (
                        <p className="mt-1 text-xs font-medium text-red-600">{errors.chapter}</p>
                    )}
                </div>
            </div>

            <div className="mt-4">
                <label htmlFor="note" className="block text-sm font-medium text-[#16241A]">
                    Note <span className="font-normal text-[#5B6B5D]">(optional)</span>
                </label>
                <textarea
                    id="note"
                    rows={3}
                    placeholder="What stood out to you?"
                    value={data.note}
                    onChange={(e) => setData('note', e.target.value)}
                    className="mt-1.5 w-full rounded-md border border-[#B9C7B4] bg-white px-3 py-2 text-sm text-[#16241A] shadow-sm placeholder:text-[#9AAA96] focus:border-[#2F6B3C] focus:outline-none focus:ring-2 focus:ring-[#2F6B3C]/30"
                />
            </div>

            {selectedBookId && data.chapter && (
                <Link
                    href={show.url({ bookId: selectedBookId, chapter: data.chapter })}
                    className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#2F6B3C] hover:text-[#153D1D] hover:underline"
                >
                    Read {data.book} {data.chapter} first →
                </Link>
            )}

            <div className="mt-6 flex items-center gap-3 border-t border-[#EDF1EA] pt-4">
                <button
                    type="submit"
                    disabled={processing || !data.book || !data.chapter}
                    className="rounded-full bg-[#2F6B3C] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#153D1D] disabled:cursor-not-allowed disabled:bg-[#9AAA96]"
                >
                    {processing ? 'Saving…' : 'Mark as read'}
                </button>
            </div>
        </form>
    );
}