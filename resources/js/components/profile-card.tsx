import { useForm, usePage } from '@inertiajs/react';
import { useRef, type ChangeEvent } from 'react';

export default function ProfileCard() {
    const { auth } = usePage<{ auth: { user: { name: string; avatar_url?: string } } }>().props;
    const fileInput = useRef<HTMLInputElement>(null);

    const { setData, post, processing, errors } = useForm<{ avatar: File | null }>({
        avatar: null,
    });

    const pickFile = () => fileInput.current?.click();

    const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        if (!file) return;

        setData('avatar', file);
        post('/avatar', {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    return (
        <div className="border-sidebar-border/70 dark:border-sidebar-border relative flex aspect-video flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border bg-gradient-to-br from-[#2F6B3C] via-[#3C7F49] to-[#1F4D28] p-4 shadow-md">
            {/* decorative background pattern */}
            <div
                className="pointer-events-none absolute inset-0 opacity-10"
                style={{
                    backgroundImage:
                        'radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                }}
            />
            {/* soft glow */}
            <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

            <button type="button" onClick={pickFile} className="group relative z-10">
                {auth.user?.avatar_url ? (
                    <img
                        src={auth.user.avatar_url}
                        alt={auth.user.name}
                        className="h-20 w-20 rounded-full object-cover ring-4 ring-white/80 transition group-hover:ring-white"
                    />
                ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/15 text-2xl font-semibold text-white ring-4 ring-white/80 backdrop-blur-sm transition group-hover:ring-white">
                        {auth.user?.name?.charAt(0).toUpperCase()}
                    </div>
                )}
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                    Change
                </span>
                {processing && (
                    <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60">
                        <svg
                            className="h-5 w-5 animate-spin text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v8z"
                            />
                        </svg>
                    </span>
                )}
            </button>

            <input
                ref={fileInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFileChange}
            />

            <p className="relative z-10 text-sm font-semibold text-white">
                {auth.user?.name}
            </p>

            {errors.avatar && (
                <p className="relative z-10 rounded-full bg-red-500/90 px-3 py-0.5 text-xs font-medium text-white">
                    {errors.avatar}
                </p>
            )}
            {processing && (
                <p className="relative z-10 text-xs font-medium text-white/80">Uploading…</p>
            )}
        </div>
    );
}