import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

const BOOKS = [
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
    'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans',
    'Psalms', 'Proverbs',
    // trim/extend this list as needed
];

export default function LogReadingForm() {
    const { data, setData, post, processing, errors, reset } = useForm({
        book: '',
        chapter: '',
        note: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/reading-entries', {
            preserveScroll: true,
            onSuccess: () => reset('chapter', 'note'),
        });
    };

    return (
        <form onSubmit={submit} className="rounded-lg border border-[#D9E3D3] bg-white p-5">
            <h3 className="text-sm font-medium text-[#16241A]">Log today's reading</h3>

            <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                    <label htmlFor="book" className="text-xs text-[#5B6B5D]">
                        Book
                    </label>
                    <select
                        id="book"
                        value={data.book}
                        onChange={(e) => setData('book', e.target.value)}
                        className="mt-1 w-full rounded-md border-[#D9E3D3] text-sm focus:border-[#2F6B3C] focus:ring-[#2F6B3C]"
                    >
                        <option value="">Select a book</option>
                        {BOOKS.map((b) => (
                            <option key={b} value={b}>
                                {b}
                            </option>
                        ))}
                    </select>
                    {errors.book && <p className="mt-1 text-xs text-red-600">{errors.book}</p>}
                </div>

                <div>
                    <label htmlFor="chapter" className="text-xs text-[#5B6B5D]">
                        Chapter
                    </label>
                    <input
                        id="chapter"
                        type="number"
                        min={1}
                        value={data.chapter}
                        onChange={(e) => setData('chapter', e.target.value)}
                        className="mt-1 w-full rounded-md border-[#D9E3D3] text-sm focus:border-[#2F6B3C] focus:ring-[#2F6B3C]"
                    />
                    {errors.chapter && <p className="mt-1 text-xs text-red-600">{errors.chapter}</p>}
                </div>
            </div>

            <div className="mt-3">
                <label htmlFor="note" className="text-xs text-[#5B6B5D]">
                    Note (optional)
                </label>
                <textarea
                    id="note"
                    rows={2}
                    value={data.note}
                    onChange={(e) => setData('note', e.target.value)}
                    className="mt-1 w-full rounded-md border-[#D9E3D3] text-sm focus:border-[#2F6B3C] focus:ring-[#2F6B3C]"
                />
            </div>

            <button
                type="submit"
                disabled={processing}
                className="mt-4 rounded-full bg-[#2F6B3C] px-5 py-2 text-sm font-medium text-white hover:bg-[#153D1D] disabled:opacity-50"
            >
                {processing ? 'Saving…' : 'Mark as read'}
            </button>
        </form>
    );
}