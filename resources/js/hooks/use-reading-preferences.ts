import { useEffect, useState } from 'react';

export interface ReadingPreferences {
    fontSize: number;
    lineSpacing: number;
    width: 'compact' | 'comfortable' | 'wide';
}

export const defaultReadingPreferences: ReadingPreferences = {
    fontSize: 20,
    lineSpacing: 1.8,
    width: 'comfortable',
};

function readPreferences(key: string): ReadingPreferences {
    try {
        const saved = JSON.parse(localStorage.getItem(key) ?? 'null');
        return {
            fontSize: [16, 18, 20, 22, 24, 26].includes(saved?.fontSize)
                ? saved.fontSize
                : defaultReadingPreferences.fontSize,
            lineSpacing: [1.6, 1.8, 2].includes(saved?.lineSpacing)
                ? saved.lineSpacing
                : defaultReadingPreferences.lineSpacing,
            width: ['compact', 'comfortable', 'wide'].includes(saved?.width)
                ? saved.width
                : defaultReadingPreferences.width,
        };
    } catch {
        return defaultReadingPreferences;
    }
}

export function useReadingPreferences(userId: number) {
    const key = `reading-preferences:${userId}`;
    const [preferences, setPreferences] = useState(defaultReadingPreferences);
    const [saved, setSaved] = useState(true);

    useEffect(() => {
        setPreferences(readPreferences(key));
        const onStorage = (event: StorageEvent) => {
            if (event.key === key || event.key === null)
                setPreferences(readPreferences(key));
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, [key]);

    const updatePreferences = (next: ReadingPreferences) => {
        setPreferences(next);
        try {
            localStorage.setItem(key, JSON.stringify(next));
            setSaved(true);
        } catch {
            setSaved(false);
        }
    };

    return { preferences, updatePreferences, saved };
}
