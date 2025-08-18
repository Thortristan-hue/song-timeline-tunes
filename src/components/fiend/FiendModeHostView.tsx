import React from 'react';
import { Song, Player } from '@/types/game';
import { CassettePlayerDisplay } from '@/components/CassettePlayerDisplay';
import { Play, Pause, Square } from 'lucide-react';

// Import new assets
import assRoomcode from '@/assets/ass_roomcode.png';
import assRythmy from '@/assets/ass_rythmy.png';
import assSpeaker from '@/assets/ass_speaker.png';
import assCassBg from '@/assets/ass_cass_bg.png';
// TODO: Add missing button assets
// import buttonBlue from '@/assets/button_blue.png';
// import buttonOrange from '@/assets/button_orange.png';

interface FiendModeHostViewProps {
  players: Player[];
  currentSong: Song | null;
  roundNumber: number;
  totalRounds: number;
  roomCode: string;
  timeLeft?: number;
  playerGuesses?: Record<string, { year: number; accuracy: number; points: number }>;
  isPlaying?: boolean;
  onPlayPause?: () => void;
  onStop?: () => void;
}

export function FiendModeHostView({
  players,
  currentSong,
  roundNumber,
  totalRounds,
  roomCode,
  timeLeft = 30,
  playerGuesses = {},
  isPlaying = false,
  onPlayPause = () => {},
  onStop = () => {}
}: FiendModeHostViewProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const allPlayersSubmitted = players.every(p => playerGuesses[p.id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#494252] to-[#3a3142] relative overflow-hidden">
      {/* Top Left - RYTHMY Logo */}
      <div className="absolute top-8 left-8 z-20">
        <img 
          src={assRythmy} 
          alt="RYTHMY" 
          className="h-16 w-auto hover:scale-105 transition-transform duration-200"
        />
      </div>

      {/* Top Right - Room Code */}
      <div className="absolute top-8 right-8 z-20">
        <div className="relative">
          <img 
            src={assRoomcode} 
            alt="Room Code" 
            className="h-16 w-auto"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-black font-bold text-lg">{roomCode}</span>
          </div>
        </div>
      </div>

      {/* Bottom Left Speaker */}
      <div className="absolute bottom-8 left-8 z-20">
        <img 
          src={assSpeaker} 
          alt="Speaker" 
          className="h-32 w-32 hover:scale-105 transition-transform duration-200"
        />
      </div>

      {/* Bottom Right Speaker */}
      <div className="absolute bottom-8 right-8 z-20">
        <img 
          src={assSpeaker} 
          alt="Speaker" 
          className="h-32 w-32 hover:scale-105 transition-transform duration-200"
        />
      </div>

      {/* Center Top - Cassette Control Panel */}
      <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-20">
        <div className="relative">
          <img 
            src={assCassBg} 
            alt="Control Panel" 
            className="h-24 w-auto"
          />
          <div className="absolute inset-0 flex items-center justify-center gap-4">
            {/* Pause Button (Blue) */}
            <button 
              onClick={onPlayPause}
              className="relative hover:scale-110 transition-transform duration-200"
            >
              <div className="h-8 w-8 bg-blue-500 rounded flex items-center justify-center hover:scale-110 transition-transform duration-200">
                <Pause className="h-4 w-4 text-white" />
              </div>
            </button>

            {/* Play Button (Blue) */}
            <button 
              onClick={onPlayPause}
              className="relative hover:scale-110 transition-transform duration-200"
            >
              <div className="h-8 w-8 bg-blue-500 rounded flex items-center justify-center hover:scale-110 transition-transform duration-200">
                <Play className="h-4 w-4 text-white" />
              </div>
            </button>

            {/* Stop Button (Orange) */}
            <button 
              onClick={onStop}
              className="relative hover:scale-110 transition-transform duration-200"
            >
              <div className="h-8 w-8 bg-orange-500 rounded flex items-center justify-center hover:scale-110 transition-transform duration-200">
                <Square className="h-4 w-4 text-white" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Center Area - Game Information */}
      <div className="flex items-center justify-center min-h-screen px-16">
        <div className="w-full max-w-4xl">
          {/* Current Song Display */}
          <div className="bg-black/20 backdrop-blur-sm rounded-3xl p-8 border border-white/10 text-center">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-white mb-2">Mystery Track</h2>
              <p className="text-white/70 text-lg">Round {roundNumber} of {totalRounds}</p>
            </div>

            <div className="bg-white/10 border border-white/20 rounded-2xl p-6 mb-6">
              {currentSong ? (
                <>
                  {/* Hide song details until all players have submitted */}
                  {!allPlayersSubmitted ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">🎵</div>
                      <div className="text-xl text-white/70 mb-2">Mystery song playing...</div>
                      <div className="text-white/50 text-sm">Song details will be revealed after all players submit</div>
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-white mb-2">{currentSong.deezer_title}</div>
                      <div className="text-xl text-white/80 font-semibold">{currentSong.deezer_artist}</div>
                      
                      <div className="mt-4 bg-green-500/20 border border-green-500/50 rounded-xl p-4">
                        <div className="text-green-400 text-sm font-bold mb-1">ACTUAL YEAR</div>
                        <div className="text-3xl font-bold text-white">{currentSong.release_year}</div>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="text-xl text-white/70 mb-2">Loading next song...</div>
                  <div className="text-white/50 text-sm">Please wait while we prepare the next round</div>
                </div>
              )}
            </div>

            {/* Player Submission Status */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {players.map(player => (
                <div 
                  key={player.id}
                  className={`p-3 rounded-xl border transition-all duration-300 ${
                    playerGuesses[player.id] 
                      ? "bg-green-500/20 border-green-500/50" 
                      : "bg-white/10 border-white/20"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full border-2 border-white/20"
                      style={{ backgroundColor: player.color }}
                    />
                    <div className="text-white font-bold text-sm truncate">{player.name}</div>
                  </div>
                  {playerGuesses[player.id] ? (
                    <div className="text-green-400 text-xs font-bold mt-1">
                      Guessed {playerGuesses[player.id].year}
                    </div>
                  ) : (
                    <div className="text-white/60 text-xs mt-1">Thinking...</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Player Cassettes - Fixed at bottom */}
      <CassettePlayerDisplay 
        players={players}
        className="bottom-20"
      />
    </div>
  );
}