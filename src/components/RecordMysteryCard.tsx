import { Song } from '@/types/game';
import { cn } from '@/lib/utils';

interface RecordMysteryCardProps {
  song: Song | null;
  className?: string;
}

export function RecordMysteryCard({ song, className }: RecordMysteryCardProps) {
  return (
    <div className={cn("relative w-40 h-56 rounded-2xl bg-gray-700 overflow-hidden shadow-lg", className)}>
      {/* Card Content */}
      {song ? (
        <>
          <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: `url(${song.deezer_album})` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-80" />
          <div className="absolute bottom-0 left-0 p-4 text-white">
            <h3 className="font-bold text-lg">{song.deezer_title}</h3>
            <p className="text-sm">{song.deezer_artist}</p>
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-gray-400">
          Loading...
        </div>
      )}
    </div>
  );
}
