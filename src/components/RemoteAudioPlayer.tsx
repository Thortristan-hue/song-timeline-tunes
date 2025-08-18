
import { useState } from 'react';

interface RemoteAudioPlayerProps {
  src: string;
  isPlaying: boolean;
  onPlayPause: () => void;
}

export function RemoteAudioPlayer({ src, isPlaying, onPlayPause }: RemoteAudioPlayerProps) {
  const [volume, setVolume] = useState(0.5);

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onPlayPause}
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <div className="flex items-center gap-2">
          <span className="text-white text-sm">Volume:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-20"
          />
        </div>
      </div>
      <audio src={src} />
    </div>
  );
}
