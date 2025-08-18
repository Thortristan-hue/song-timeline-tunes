
import { Song, Player } from '@/types/game';

interface HostCurrentPlayerTimelineProps {
  currentPlayer: Player;
  currentSong?: Song | null;
}

export function HostCurrentPlayerTimeline({
  currentPlayer,
  currentSong
}: HostCurrentPlayerTimelineProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-white text-lg font-semibold mb-4">
        {currentPlayer.name}'s Timeline
      </h3>
      <div className="flex space-x-2">
        {currentPlayer.timeline.map((song, index) => (
          <div
            key={song.id}
            className="bg-gray-700 rounded p-2 text-white text-sm"
          >
            <div className="font-medium">{song.deezer_title}</div>
            <div className="text-gray-400">{song.deezer_artist}</div>
          </div>
        ))}
        {currentSong && (
          <div className="bg-blue-600 rounded p-2 text-white text-sm border-2 border-blue-400">
            <div className="font-medium">{currentSong.deezer_title}</div>
            <div className="text-blue-200">{currentSong.deezer_artist}</div>
          </div>
        )}
      </div>
    </div>
  );
}
