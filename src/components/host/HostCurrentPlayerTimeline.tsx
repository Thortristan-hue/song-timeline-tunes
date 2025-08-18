import { Song, Player } from '@/types/game';
import { cn } from '@/lib/utils';
import { Play, Pause, Volume2 } from 'lucide-react';

interface HostCurrentPlayerTimelineProps {
  player: Player;
  currentTurn: number;
  throwingCard: number | null;
  confirmingPlacement: { song: Song; position: number } | null;
  cardResult: { correct: boolean; song: Song } | null;
  transitioningTurn: boolean;
  currentSong: Song | null;
  mysteryCardRevealed: boolean;
  onCardPlacement?: (song: Song, position: number) => void;
  onConfirmPlacement?: () => void;
  onRejectPlacement?: () => void;
}

export function HostCurrentPlayerTimeline({
  player,
  currentTurn,
  throwingCard,
  confirmingPlacement,
  cardResult,
  transitioningTurn,
  currentSong,
  mysteryCardRevealed,
  onCardPlacement,
  onConfirmPlacement,
  onRejectPlacement
}: HostCurrentPlayerTimelineProps) {
  const handleCardClick = (song: Song, position: number) => {
    if (onCardPlacement) {
      onCardPlacement(song, position);
    }
  };

  const hasPreview = !!currentSong?.preview_url;
  const isPlaying = false;
  const isLoadingPreview = false;

  return (
    <div className="flex flex-col h-full">
      {/* Player Info Header */}
      <div className="p-4 border-b border-gray-700/50">
        <h3 className="text-lg font-semibold text-white">{player.name}'s Timeline</h3>
        <p className="text-sm text-gray-400">Current Score: {player.score} points</p>
      </div>

      {/* Timeline Display */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="relative">
          {/* Vertical Timeline Line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-700/50 transform -translate-x-1/2"></div>

          {/* Timeline Items */}
          {player.timeline.map((song, index) => {
            const isCurrent = index === currentTurn;
            const isPlaceholder = index === player.timeline.length - 1 && player.timeline.length < 8;
            const isHighlighted = confirmingPlacement?.position === index;
            const isCorrect = cardResult?.correct && cardResult?.song.id === song.id;
            const isIncorrect = cardResult && !cardResult.correct && cardResult.song.id === song.id;

            return (
              <div key={song.id} className="mb-6 relative">
                <div className="flex items-center">
                  {/* Timeline Circle/Dot */}
                  <div
                    className={cn(
                      "z-10 w-6 h-6 rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg",
                      isCurrent ? "from-purple-500 to-blue-500" : "from-gray-700 to-gray-800",
                      isHighlighted && "from-green-500 to-green-600",
                      isCorrect && "from-green-500 to-green-600",
                      isIncorrect && "from-red-500 to-red-600"
                    )}
                  >
                    {/* Inner Dot */}
                    <div className="w-3 h-3 rounded-full bg-white/10"></div>
                  </div>

                  {/* Timeline Content */}
                  <div className="flex-1 ml-4">
                    <div
                      className={cn(
                        "bg-gray-800/70 border border-gray-700/50 rounded-lg p-3 backdrop-blur-sm shadow-md transition-all duration-300",
                        isCurrent && "scale-105",
                        isHighlighted && "border-green-500",
                        isCorrect && "border-green-500",
                        isIncorrect && "border-red-500",
                        isPlaceholder && "opacity-50"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-lg font-semibold text-white">{song.deezer_title}</h4>
                        <span className="text-sm text-gray-400">{song.release_year}</span>
                      </div>
                      <p className="text-gray-400">{song.deezer_artist}</p>
                      <p className="text-gray-500 text-sm">{song.deezer_album}</p>

                      {/* Card Controls */}
                      {isCurrent && currentSong && (
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleCardClick(song, index)}
                              className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-3 py-1 text-sm transition-colors duration-200"
                            >
                              Place Card
                            </button>
                          </div>
                          <div className="flex items-center space-x-2">
                            {hasPreview && (
                              <>
                                <button
                                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-3 py-1 text-sm transition-colors duration-200"
                                >
                                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                </button>
                                <Volume2 className="h-4 w-4 text-gray-400" />
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Placeholder Cards */}
          {Array.from({ length: Math.max(0, 8 - player.timeline.length) }).map((_, index) => {
            const placeholderIndex = player.timeline.length + index;
            const isHighlighted = confirmingPlacement?.position === placeholderIndex;

            return (
              <div key={`placeholder-${index}`} className="mb-6 relative">
                <div className="flex items-center">
                  {/* Timeline Circle/Dot */}
                  <div className="z-10 w-6 h-6 rounded-full bg-gray-700/50 flex items-center justify-center shadow-lg">
                    {/* Inner Dot */}
                    <div className="w-3 h-3 rounded-full bg-white/10"></div>
                  </div>

                  {/* Timeline Content */}
                  <div className="flex-1 ml-4">
                    <div
                      className={cn(
                        "bg-gray-800/30 border border-gray-700/30 rounded-lg p-3 backdrop-blur-sm shadow-md opacity-50 transition-all duration-300",
                        isHighlighted && "border-green-500"
                      )}
                    >
                      <h4 className="text-lg font-semibold text-white/50">Empty Slot</h4>
                      <p className="text-gray-500 text-sm">Waiting for card placement...</p>

                      {/* Card Controls - Conditionally render based on confirmingPlacement */}
                      {isHighlighted && confirmingPlacement && onConfirmPlacement && onRejectPlacement && (
                        <div className="mt-3 flex items-center justify-between">
                          <button
                            onClick={onConfirmPlacement}
                            className="bg-green-600 hover:bg-green-700 text-white rounded-full px-3 py-1 text-sm transition-colors duration-200"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={onRejectPlacement}
                            className="bg-red-600 hover:bg-red-700 text-white rounded-full px-3 py-1 text-sm transition-colors duration-200"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
