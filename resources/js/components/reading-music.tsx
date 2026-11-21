import { useEffect, useState, type RefObject } from 'react';
import { Music2, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export interface ReadingSong {
    id: string;
    title: string;
    url: string;
}

export default function ReadingMusic({
    songs,
    audioRef,
    onPlay,
}: {
    songs: ReadingSong[];
    audioRef: RefObject<HTMLAudioElement | null>;
    onPlay: () => void;
}) {
    const [selected, setSelected] = useState('');
    const [failed, setFailed] = useState(false);
    const song = songs.find((item) => item.id === selected);
    useEffect(() => {
        const audio = audioRef.current;
        return () => audio?.pause();
    }, [song?.id, audioRef]);

    return (
        <section
            aria-labelledby="reading-music-title"
            className="bg-card space-y-4 rounded-xl border p-4 shadow-sm"
        >
            <div>
                <h2
                    id="reading-music-title"
                    className="flex items-center gap-2 text-sm font-semibold"
                >
                    <Music2
                        className="text-primary size-4"
                        aria-hidden="true"
                    />
                    Reading music
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                    Listen to a song while you read. Playing music stops chapter
                    narration; listening to the chapter pauses music. Your song
                    keeps playing as you move between chapters.
                </p>
            </div>
            {songs.length ? (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="reading-song">Choose a song</Label>
                        <select
                            id="reading-song"
                            value={song?.id ?? ''}
                            onChange={(event) => {
                                audioRef.current?.pause();
                                setFailed(false);
                                setSelected(event.target.value);
                            }}
                            className="border-input bg-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
                        >
                            <option value="">Select a song</option>
                            {songs.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.title}
                                </option>
                            ))}
                        </select>
                    </div>
                    {song && (
                        <audio
                            key={song.id}
                            ref={audioRef}
                            controls
                            preload="none"
                            src={song.url}
                            aria-label={`Play ${song.title}`}
                            className="w-full"
                            onPlay={() => {
                                setFailed(false);
                                onPlay();
                            }}
                            onError={() => setFailed(true)}
                        />
                    )}
                    {song && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                const audio = audioRef.current;
                                if (!audio) return;
                                audio.pause();
                                audio.currentTime = 0;
                            }}
                        >
                            <Square aria-hidden="true" />
                            Stop song
                        </Button>
                    )}
                    {failed && (
                        <p role="alert" className="text-destructive text-sm">
                            This song could not be played. Try another song or
                            check your connection.
                        </p>
                    )}
                </>
            ) : (
                <p className="text-muted-foreground text-sm">
                    Songs will appear here when the library is available.
                </p>
            )}
        </section>
    );
}
