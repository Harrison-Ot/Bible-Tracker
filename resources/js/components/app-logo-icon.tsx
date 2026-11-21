import type { ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export default function AppLogoIcon({
    className,
    alt = '',
    ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            {...props}
            src="/pwa-icon.svg"
            alt={alt}
            className={cn('size-8 shrink-0 object-contain', className)}
        />
    );
}
