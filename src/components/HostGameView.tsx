import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Music, Play, Pause, Users, Trophy, Star, Crown } from 'lucide-react';
import { Song, Player } from '@/types/game';
import { RecordMysteryCard } from '@/components/RecordMysteryCard';
import { CassettePlayerDisplay } from '@/components/CassettePlayerDisplay';

// Host Game Background
export function HostGameBackground() {
  return (
 <div className="absolute inset-0">
 <div className="absolute top-20 left-20 w-96 h-96 rounded-full animate-pulse" />
 <div className="absolute bottom-32 right-32 w-80 h-80 rounded-full animate-pulse" style={{animationDelay: '2s'}} />
 <div className="absolute top-1/2 left-1/2 - - w-[600px] h-[600px] rounded-full" />
      
 <div className="absolute top-0 left-0 w-full h-full pointer-events-none" />
    </div>
  );
}

// Redesigned Host Header - Compact and positioned at top
interface HostHeaderProps {
  roomCode: string;
  playersCount: number;
}

export function HostHeader({ roomCode, playersCount }: HostHeaderProps) {
  return (
 <div className="absolute top-4 left-4 right-4">
 <div className="flex justify-between items-center">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 rounded-2xl flex items-center justify-center">
 <Crown className="h-6 w-6 text-yellow-400" />
          </div>
          <div>
 <div className="text-white font-bold text-2xl tracking-tight">Timeliner</div>
 <div className="text-white/70 text-sm font-medium">Host Display</div>
          </div>
        </div>

 <div className="flex items-center gap-4">
 <div className="px-4 py-2 rounded-2xl">
 <div className="flex items-center gap-2">
 <Users className="h-4 w-4 text-blue-400" />
 <div className="text-white font-bold text-lg">{playersCount}</div>
            </div>
          </div>

 <div className="px-4 py-2 rounded-2xl">
 <div className="text-white font-mono text-lg font-bold tracking-wider">{roomCode}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Record Player Section - Positioned at top center
interface RecordPlayerSectionProps {
  currentSong: Song | null;
  mysteryCardRevealed: boolean;
  isPlaying: boolean;
  onPlayPause: () => void;
  cardPlacementResult: { correct: boolean; song: Song } | null;
}

export function RecordPlayerSection({
  currentSong,
  mysteryCardRevealed,
  isPlaying,
  onPlayPause,
  cardPlacementResult
}: RecordPlayerSectionProps) {
  return (
 <div className="absolute top-16 left-1/2 -">
 <div className="text-center">
        {/* Record Player with Mystery Record */}
 <div className="relative">
 <div className="absolute inset-0 rounded-3xl" />
          <div 
 className="relative cursor-pointer duration-300"
            onClick={onPlayPause}
          >
            <RecordMysteryCard
              song={currentSong}
              isRevealed={mysteryCardRevealed}
              isDestroyed={cardPlacementResult?.correct === false}
 className="relative"
            />
            
            {/* Play/Pause overlay on record */}
            {currentSong?.preview_url && (
 <div className="absolute top-1/2 left-1/2 - - rounded-full p-2 hover:">
                {isPlaying ? (
 <Pause className="h-6 w-6 text-white" />
                ) : (
 <Play className="h-6 w-6 text-white" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Current Player Info - Positioned in center
interface CurrentPlayerInfoProps {
  currentPlayer: Player;
  currentSong: Song | null;
}

export function CurrentPlayerInfo({ currentPlayer, currentSong }: CurrentPlayerInfoProps) {
  return (
 <div className="absolute top-1/2 left-1/2 - -">
 <div className="rounded-3xl p-6 max-w-md mx-auto">
 <div className="flex items-center justify-center gap-4 mb-4">
          <div 
 className="w-6 h-6 rounded-full"             style={{ backgroundColor: currentPlayer.color }}
          />
 <div className="text-white text-2xl font-semibold">
            {currentPlayer.name}
          </div>
 <div className="text-white px-4 py-2 rounded-full text-base font-semibold">
            {currentPlayer.score}/10
          </div>
        </div>
        
 <div className="text-white/70 text-lg text-center mb-4">
          {currentSong ? 
            "Thinking about where this song fits..." : 
            "Waiting for the next song..."
          }
        </div>

        {/* Progress bar */}
 <div className="w-full rounded-full h-2 mb-2">
          <div 
 className="h-2 rounded-full duration-500"
            style={{ width: `${(currentPlayer.timeline.length / 10) * 100}%` }}
          />
        </div>
 <div className="text-white/60 text-sm text-center">
          {currentPlayer.timeline.length}/10 cards placed
        </div>
      </div>
    </div>
  );
}

// Leaderboard - Positioned on the right side
interface LeaderboardProps {
  players: Player[];
}

export function Leaderboard({ players }: LeaderboardProps) {
  return (
 <div className="absolute top-20 right-4 w-72">
 <div className="rounded-3xl p-4">
 <div className="flex items-center gap-3 mb-4">
 <Trophy className="h-5 w-5 text-yellow-400" />
 <div className="text-white font-bold text-lg">Leaderboard</div>
        </div>

 <div className="space-y-2 max-h-80 overflow-y-auto">
          {players
            .sort((a, b) => b.score - a.score)
            .map((player, index) => (
 <div key={player.id} className="flex items-center gap-3 p-3 rounded-xl">
 <div className="text-white/70 font-bold text-sm w-4">#{index + 1}</div>
                <div 
 className="w-3 h-3 rounded-full"                   style={{ backgroundColor: player.color }}
                />
 <div className="flex-1 min-w-0">
 <div className="text-white font-semibold text-sm truncate">{player.name}</div>
 <div className="text-white/60 text-xs">{player.timeline.length} cards</div>
                </div>
 <div className="text-white font-bold text-lg">{player.score}</div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// Timeline Display - Positioned on the left side, moved up
interface TimelineDisplayProps {
  currentPlayer: Player;
}

export function TimelineDisplay({ currentPlayer }: TimelineDisplayProps) {
  return (
 <div className="absolute top-80 left-4 w-80">
 <div className="rounded-3xl p-4">
 <div className="flex items-center gap-3 mb-4">
          <div 
 className="w-5 h-5 rounded-full"             style={{ backgroundColor: currentPlayer.color }}
          />
 <div className="text-white font-bold text-lg">{currentPlayer.name}'s Timeline</div>
        </div>

 <div className="space-y-2 max-h-60 overflow-y-auto">
          {currentPlayer.timeline.length === 0 ? (
 <div className="text-center py-8">
 <div className="text-white/50 text-sm">No cards placed yet</div>
            </div>
          ) : (
            currentPlayer.timeline.map((song, index) => (
 <div key={index} className="flex items-center gap-3 p-3 rounded-xl">
 <div className="text-white/70 font-bold text-sm w-6">{index + 1}</div>
 <div className="flex-1 min-w-0">
 <div className="text-white text-sm font-medium truncate">{song.deezer_title}</div>
 <div className="text-white/70 text-xs truncate">{song.deezer_artist}</div>
                </div>
 <div className="text-white text-xs px-2 py-1 rounded-full font-bold">
                  {song.release_year}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Main Host Game View - Redesigned Layout
interface HostGameViewProps {
  currentTurnPlayer: Player;
  currentSong: Song | null;
  roomCode: string;
  players: Player[];
  mysteryCardRevealed: boolean;
  isPlaying: boolean;
  onPlayPause: () => void;
  cardPlacementResult: { correct: boolean; song: Song } | null;
}

export function HostGameView({
  currentTurnPlayer,
  currentSong,
  roomCode,
  players,
  mysteryCardRevealed,
  isPlaying,
  onPlayPause,
  cardPlacementResult
}: HostGameViewProps) {
  return (
 <div className="min-h-screen relative overflow-hidden">
      <HostGameBackground />
      
      {/* Header */}
      <HostHeader roomCode={roomCode} playersCount={players.length} />

      {/* Record Player Section - Top Center */}
      <RecordPlayerSection 
        currentSong={currentSong}
        mysteryCardRevealed={mysteryCardRevealed}
        isPlaying={isPlaying}
        onPlayPause={onPlayPause}
        cardPlacementResult={cardPlacementResult}
      />

      {/* Timeline Display - Left Side, moved up */}
      <TimelineDisplay currentPlayer={currentTurnPlayer} />

      {/* Leaderboard - Right Side */}
      <Leaderboard players={players} />

      {/* Cassette Player Display - Bottom */}
 <div className="absolute bottom-4 left-4 right-4">
        <CassettePlayerDisplay 
          players={players} 
          currentPlayerId={currentTurnPlayer.id}
        />
      </div>

      {/* Result Display - Full Screen Overlay */}
      {cardPlacementResult && (
 <div className="fixed inset-0 flex items-center justify-center">
 <div className="text-center space-y-8 p-8">
 <div className={`text-9xl mb-6 ${
              cardPlacementResult.correct ? 'animate-bounce' : 'animate-pulse'
            }`}>
              {cardPlacementResult.correct ? '🎯' : '💫'}
            </div>
            
 <div className={`text-6xl font-black tracking-tight ${
              cardPlacementResult.correct ? 
              'text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400' : 
              'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400'
            }`}>
              {cardPlacementResult.correct ? 'PERFECT MATCH!' : 'NICE TRY!'}
            </div>
            
 <div className="rounded-3xl p-8 max-w-lg">
 <div className="text-3xl font-bold text-white mb-3">
                {cardPlacementResult.song.deezer_title}
              </div>
 <div className="text-2xl text-white/80 mb-6 font-medium">
                by {cardPlacementResult.song.deezer_artist}
              </div>
 <div className="inline-block text-white px-6 py-3 rounded-full font-bold text-2xl">
                {cardPlacementResult.song.release_year}
              </div>
            </div>

 <div className="text-white/60 text-xl">
              {cardPlacementResult.correct ? 
                `${currentTurnPlayer.name} scored a point!` : 
                `Better luck next time, ${currentTurnPlayer.name}!`
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Alternative Simplified Host Display
interface HostDisplayProps {
  currentTurnPlayer: Player;
  currentSong: Song | null;
  roomCode: string;
  players: Player[];
  mysteryCardRevealed: boolean;
  isPlaying: boolean;
  onPlayPause: () => void;
  cardPlacementResult: { correct: boolean; song: Song } | null;
}

export function HostDisplay({
  currentTurnPlayer,
  currentSong,
  roomCode,
  players,
  mysteryCardRevealed,
  isPlaying,
  onPlayPause,
  cardPlacementResult
}: HostDisplayProps) {
  return (
 <div className="min-h-screen relative overflow-hidden">
      <HostGameBackground />
      
      {/* Header */}
      <HostHeader roomCode={roomCode} playersCount={players.length} />

      {/* Record Player Section - Top Center */}
      <RecordPlayerSection 
        currentSong={currentSong}
        mysteryCardRevealed={mysteryCardRevealed}
        isPlaying={isPlaying}
        onPlayPause={onPlayPause}
        cardPlacementResult={cardPlacementResult}
      />

      {/* Cassette Player Display - Bottom */}
 <div className="absolute bottom-4 left-4 right-4">
        <CassettePlayerDisplay 
          players={players} 
          currentPlayerId={currentTurnPlayer.id}
        />
      </div>
    </div>
  );
}
