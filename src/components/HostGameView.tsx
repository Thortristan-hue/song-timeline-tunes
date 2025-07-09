import React from 'react';
import { Crown, Users, Play, Pause, Music } from 'lucide-react';
import { Song, Player } from '@/types/game';
import { RecordMysteryCard } from '@/components/RecordMysteryCard';
import { CassettePlayerDisplay } from '@/components/CassettePlayerDisplay';

// Background component remains unchanged
export function HostGameBackground() {
  return (
    <div className="absolute inset-0">
      <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-32 right-32 w-80 h-80 bg-purple-500/8 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl" />
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-950/50 via-transparent to-slate-900/30 pointer-events-none" />
    </div>
  );
}

interface HostHeaderProps {
  roomCode: string;
  playersCount: number;
}

function HostHeader({ roomCode, playersCount }: HostHeaderProps) {
  return (
    <div className="absolute top-4 left-4 right-4 z-40">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/15 backdrop-blur-2xl rounded-2xl flex items-center justify-center border border-white/20">
            <Crown className="h-6 w-6 text-yellow-400" />
          </div>
          <div>
            <div className="text-white font-bold text-2xl tracking-tight">Timeliner</div>
            <div className="text-white/70 text-sm font-medium">Host Display</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-white/15 backdrop-blur-2xl px-4 py-2 rounded-2xl border border-white/20">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-400" />
              <div className="text-white font-bold text-lg">{playersCount}</div>
            </div>
          </div>

          <div className="bg-white/15 backdrop-blur-2xl px-4 py-2 rounded-2xl border border-white/20">
            <div className="text-white font-mono text-lg font-bold tracking-wider">{roomCode}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface RecordPlayerSectionProps {
  currentSong: Song | null;
  mysteryCardRevealed: boolean;
  isPlaying: boolean;
  onPlayPause: () => void;
  cardPlacementResult: { correct: boolean; song: Song } | null;
}

function RecordPlayerSection({
  currentSong,
  mysteryCardRevealed,
  isPlaying,
  onPlayPause,
  cardPlacementResult
}: RecordPlayerSectionProps) {
  return (
    <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-30">
      <div className="relative">
        <div className="absolute inset-0 bg-white/8 rounded-3xl blur-xl scale-110" />
        <div 
          className="relative cursor-pointer transition-all duration-300 hover:scale-105"
          onClick={onPlayPause}
        >
          <RecordMysteryCard
            song={currentSong}
            isRevealed={mysteryCardRevealed}
            isDestroyed={cardPlacementResult?.correct === false}
          />
          
          {currentSong?.preview_url && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/50 backdrop-blur-sm rounded-full p-2 opacity-0 hover:opacity-100 transition-opacity">
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
  );
}

// Function to generate consistent color from artist name
const getArtistColor = (artist: string): string => {
  // Simple hash function to convert string to number
  let hash = 0;
  for (let i = 0; i < artist.length; i++) {
    hash = artist.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Convert hash to hue (0-360)
  const hue = Math.abs(hash) % 360;
  
  // Return HSL color string with fixed saturation/lightness
  return `hsl(${hue}, 70%, 60%)`;
};

// New centered timeline for host
interface HostTimelineProps {
  currentPlayer: Player;
}

function HostTimeline({ currentPlayer }: HostTimelineProps) {
  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4/5 max-w-6xl z-30">
      <div className="bg-slate-800/80 backdrop-blur-lg rounded-3xl p-6 border border-slate-700 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div 
            className="w-6 h-6 rounded-full shadow-lg" 
            style={{ backgroundColor: currentPlayer.color }}
          />
          <div className="text-white font-bold text-xl">{currentPlayer.name}'s Timeline</div>
        </div>
        
        <div className="flex justify-center flex-wrap gap-4">
          {currentPlayer.timeline.length === 0 ? (
            <div className="text-center w-full py-4">
              <div className="text-white/50 text-sm">No cards placed yet</div>
            </div>
          ) : (
            currentPlayer.timeline.map((song, index) => (
              <div 
                key={index}
                className="w-32 h-44 rounded-xl flex flex-col items-center justify-between p-3 text-white shadow-lg"
                style={{ backgroundColor: getArtistColor(song.deezer_artist) }}
              >
                <div className="text-center w-full">
                  <div className="text-sm font-bold truncate">
                    {song.deezer_artist}
                  </div>
                </div>
                
                <div className="text-4xl font-bold">
                  {song.release_year}
                </div>
                
                <div className="text-center w-full text-xs italic truncate">
                  {song.deezer_title}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 relative overflow-hidden">
      <HostGameBackground />
      <HostHeader roomCode={roomCode} playersCount={players.length} />
      <RecordPlayerSection 
        currentSong={currentSong}
        mysteryCardRevealed={mysteryCardRevealed}
        isPlaying={isPlaying}
        onPlayPause={onPlayPause}
        cardPlacementResult={cardPlacementResult}
      />
      <HostTimeline currentPlayer={currentTurnPlayer} />
      
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <CassettePlayerDisplay 
          players={players} 
          currentPlayerId={currentTurnPlayer.id}
        />
      </div>

      {cardPlacementResult && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-2xl flex items-center justify-center z-50">
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
            
            <div className="bg-white/10 backdrop-blur-3xl rounded-3xl p-8 border border-white/20 max-w-lg">
              <div className="text-3xl font-bold text-white mb-3">
                {cardPlacementResult.song.deezer_title}
              </div>
              <div className="text-2xl text-white/80 mb-6 font-medium">
                by {cardPlacementResult.song.deezer_artist}
              </div>
              <div className="inline-block bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-full font-bold text-2xl">
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
