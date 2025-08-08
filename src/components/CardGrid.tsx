
import { Song } from '@/types/game';

interface CardGridProps {
  availableSongs: Song[];
  onCardClick: (song: Song, position: number) => void;
  isProcessingMove: boolean;
}

export function CardGrid({ availableSongs, onCardClick, isProcessingMove }: CardGridProps) {
  const handleCardClick = (song: Song) => {
    if (!isProcessingMove) {
      // For available songs, we just pass position 0 as default
      onCardClick(song, 0);
    }
  };

  return (
    <div className="p-4 bg-slate-800">
      <h3 className="text-lg font-semibold text-white mb-4">Available Cards ({availableSongs.length})</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 max-h-48 overflow-y-auto">
        {availableSongs.map((song) => (
          <div
            key={song.id}
            className={`bg-slate-700 p-3 rounded-lg cursor-pointer hover:bg-slate-600 transition-colors min-h-[120px] flex flex-col justify-between ${isProcessingMove ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => handleCardClick(song)}
          >
            <div>
              <div className="text-xs text-white font-medium mb-1 line-clamp-2">{song.deezer_title}</div>
              <div className="text-xs text-slate-400 mb-1">{song.deezer_artist}</div>
            </div>
            <div className="text-sm font-bold text-white bg-gradient-to-r from-blue-500 to-purple-500 text-center py-1 rounded">
              {song.release_year}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
