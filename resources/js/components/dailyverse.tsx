import { useEffect, useState } from 'react';

interface DailyVerseData {
    reference: string;
    text: string;
    translation: string;
}

// Fallback pool used only if the backend request fails —
// keeps the dashboard from showing an empty/broken card.
const FALLBACK_VERSES: DailyVerseData[] = [
    { reference: 'Psalm 46:1', text: 'God is our refuge and strength, a very present help in trouble.', translation: 'KJV' },
    { reference: 'Proverbs 3:5', text: 'Trust in the Lord with all thine heart; and lean not unto thine own understanding.', translation: 'KJV' },
    { reference: 'Philippians 4:13', text: 'I can do all things through Christ who strengtheneth me.', translation: 'KJV' },
    { reference: 'John 3:16', text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.', translation: 'KJV' },
    { reference: 'Jeremiah 29:11', text: 'For I know the thoughts that I think toward you, saith the Lord, thoughts of peace, and not of evil, to give you an expected end.', translation: 'KJV' },
    { reference: 'Romans 8:28', text: 'And we know that all things work together for good to them that love God.', translation: 'KJV' },
    { reference: 'Isaiah 41:10', text: 'Fear thou not; for I am with thee: be not dismayed; for I am thy God.', translation: 'KJV' },
    { reference: 'Matthew 11:28', text: 'Come unto me, all ye that labour and are heavy laden, and I will give you rest.', translation: 'KJV' },
    { reference: 'Psalm 23:1', text: 'The Lord is my shepherd; I shall not want.', translation: 'KJV' },
    { reference: 'Psalm 119:105', text: 'Thy word is a lamp unto my feet, and a light unto my path.', translation: 'KJV' },
    { reference: 'Joshua 1:9', text: 'Be strong and of a good courage; be not afraid, neither be thou dismayed: for the Lord thy God is with thee whithersoever thou goest.', translation: 'KJV' },
    { reference: 'Romans 12:2', text: 'And be not conformed to this world: but be ye transformed by the renewing of your mind.', translation: 'KJV' },
    { reference: '2 Timothy 1:7', text: 'For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.', translation: 'KJV' },
    { reference: 'Psalm 34:8', text: 'O taste and see that the Lord is good: blessed is the man that trusteth in him.', translation: 'KJV' },
    { reference: 'Matthew 6:33', text: 'But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.', translation: 'KJV' },
    { reference: 'Galatians 5:22', text: 'But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith.', translation: 'KJV' },
    { reference: '1 Corinthians 13:4', text: 'Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up.', translation: 'KJV' },
    { reference: 'Psalm 27:1', text: 'The Lord is my light and my salvation; whom shall I fear?', translation: 'KJV' },
    { reference: 'Hebrews 11:1', text: 'Now faith is the substance of things hoped for, the evidence of things not seen.', translation: 'KJV' },
    { reference: 'Proverbs 16:3', text: 'Commit thy works unto the Lord, and thy thoughts shall be established.', translation: 'KJV' },
    { reference: 'Psalm 37:4', text: 'Delight thyself also in the Lord; and he shall give thee the desires of thine heart.', translation: 'KJV' },
    { reference: 'Isaiah 40:31', text: 'But they that wait upon the Lord shall renew their strength; they shall mount up with wings as eagles.', translation: 'KJV' },
    { reference: 'Matthew 5:14', text: 'Ye are the light of the world. A city that is set on an hill cannot be hid.', translation: 'KJV' },
    { reference: 'Psalm 121:1', text: 'I will lift up mine eyes unto the hills, from whence cometh my help.', translation: 'KJV' },
    { reference: '1 Peter 5:7', text: 'Casting all your care upon him; for he careth for you.', translation: 'KJV' },
    { reference: 'Ephesians 2:8', text: 'For by grace are ye saved through faith; and that not of yourselves: it is the gift of God.', translation: 'KJV' },
    { reference: 'Colossians 3:23', text: 'And whatsoever ye do, do it heartily, as to the Lord, and not unto men.', translation: 'KJV' },
    { reference: 'Psalm 19:14', text: 'Let the words of my mouth, and the meditation of my heart, be acceptable in thy sight, O Lord.', translation: 'KJV' },
    { reference: 'Micah 6:8', text: 'He hath shewed thee, O man, what is good; and what doth the Lord require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?', translation: 'KJV' },
    { reference: 'John 14:27', text: 'Peace I leave with you, my peace I give unto you: let not your heart be troubled, neither let it be afraid.', translation: 'KJV' },
    { reference: 'Psalm 118:24', text: 'This is the day which the Lord hath made; we will rejoice and be glad in it.', translation: 'KJV' },
];

export default function DailyVerse() {
    const [verse, setVerse] = useState<DailyVerseData | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        let cancelled = false;

        fetch('/api/bible')
            .then((res) => {
                if (!res.ok) throw new Error('Request failed');
                return res.json();
            })
            .then((data: DailyVerseData) => {
                if (!cancelled) setVerse(data);
            })
            .catch(() => {
                if (!cancelled) {
                    const fallback = FALLBACK_VERSES[Math.floor(Math.random() * FALLBACK_VERSES.length)];
                    setVerse(fallback);
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const copyVerse = () => {
        if (!verse) return;
        navigator.clipboard.writeText(`"${verse.text}" — ${verse.reference}`).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        });
    };

    return (
        <div className="rounded-xl border border-[#D9E3D3] bg-gradient-to-br from-[#2F6B3C] to-[#1F4D28] p-6 text-white shadow-sm">
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-white/70">
                    Verse of the day
                </span>
                {verse && (
                    <button
                        onClick={copyVerse}
                        className="rounded-full border border-white/30 px-3 py-1 text-xs font-medium text-white/90 hover:bg-white/10"
                    >
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                )}
            </div>

            <div className="mt-4 min-h-[72px]">
                {loading ? (
                    <div className="space-y-2">
                        <div className="h-3 w-full animate-pulse rounded bg-white/20" />
                        <div className="h-3 w-5/6 animate-pulse rounded bg-white/20" />
                        <div className="h-3 w-2/3 animate-pulse rounded bg-white/20" />
                    </div>
                ) : (
                    <p className="text-lg leading-relaxed">{verse?.text}</p>
                )}
            </div>

            {!loading && verse && (
                <p className="mt-4 text-sm font-medium text-white/80">
                    {verse.reference} · {verse.translation}
                </p>
            )}
        </div>
    );
}