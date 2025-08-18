
import { Song } from '@/types/game';

interface RecordMysteryCardProps {
  song: Song;
  onRecordStart?: () => void;
  onRecordStop?: (song: Song) => void;
}

export function RecordMysteryCard({ song, onRecordStart, onRecordStop }: RecordMysteryCardProps) {
  const handleRecordStart = () => {
    onRecordStart?.();
  };

  const handleRecordStop = () => {
    onRecordStop?.(song);
  };

  return (
    <div className="bg-purple-600 p-6 rounded-lg">
      <div className="text-lg font-semibold text-white">{song.deezer_title}</div>
      <div className="text-purple-200">{song.deezer_artist}</div>
      <div className="text-purple-300 text-sm">{song.deezer_album}</div>
      <div className="text-2xl font-bold mt-4 text-white">{song.release_year}</div>
      
      <div className="mt-4 space-y-2">
        <button
          onClick={handleRecordStart}
          className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
        >
          Start Recording
        </button>
        <button
          onClick={handleRecordStop}
          className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded"
        >
          Stop Recording
        </button>
      </div>
    </div>
  );
}
