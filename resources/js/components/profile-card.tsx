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
        <div className="border-sidebar-border/70 dark:border-sidebar-border relative flex aspect-video flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border bg-white p-4">
            <button type="button" onClick={pickFile} className="group relative">
                {auth.user?.avatar_url ? (
                    <img
                        src={auth.user.avatar_url}
                        alt={auth.user.name}
                        className="h-16 w-16 rounded-full object-cover"
                    />
                ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#2F6B3C] text-lg font-medium text-white">
                        {auth.user?.name?.charAt(0).toUpperCase()}
                    </div>
                )}
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                    Change
                </span>
            </button>

            <input
                ref={fileInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFileChange}
            />

            <p className="text-sm font-medium text-[#16241A]">{auth.user?.name}</p>
            {errors.avatar && <p className="text-xs text-red-600">{errors.avatar}</p>}
            {processing && <p className="text-xs text-[#5B6B5D]">Uploading…</p>}
        </div>
    );
}