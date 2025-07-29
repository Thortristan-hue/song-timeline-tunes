import React from 'react';
import { Song, Player } from '@/types/game';
import { CassettePlayerDisplay } from '@/components/CassettePlayerDisplay';
import { Play, Pause, Square } from 'lucide-react';

// Import new assets
import assRoomcode from '@/assets/ass_roomcode.png';
import assRythmy from '@/assets/ass_rythmy.png';
import assSpeaker from '@/assets/ass_speaker.png';
import assCassBg from '@/assets/ass_cass_bg.png';
import buttonBlue from '@/assets/button_blue.png';
import buttonOrange from '@/assets/button_orange.png';

interface SprintModeHostViewProps {
  players: Player[];
  currentSong: Song;
  targetCards: number;
  roomCode: string;
  timeLeft?: number;
  playerTimeouts?: Record<string, number>;
  recentPlacements?: Record<string, { correct: boolean; song: Song; timestamp: number }>;
  isPlaying?: boolean;
  onPlayPause?: () => void;
  onStop?: () => void;
}

export function SprintModeHostView({
  players,
  currentSong,
  targetCards,
  roomCode,
  timeLeft = 30,
  playerTimeouts = {},
  recentPlacements = {},
  isPlaying = false,
  onPlayPause = () => {},
  onStop = () => {}
}: SprintModeHostViewProps) {
  const sortedPlayers = [...players].sort((a, b) => b.timeline.length - a.timeline.length);

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
              <img src={buttonBlue} alt="Pause" className="h-8 w-8" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Pause className="h-4 w-4 text-white" />
              </div>
            </button>

            {/* Play Button (Blue) */}
            <button 
              onClick={onPlayPause}
              className="relative hover:scale-110 transition-transform duration-200"
            >
              <img src={buttonBlue} alt="Play" className="h-8 w-8" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Play className="h-4 w-4 text-white" />
              </div>
            </button>

            {/* Stop Button (Orange) */}
            <button 
              onClick={onStop}
              className="relative hover:scale-110 transition-transform duration-200"
            >
              <img src={buttonOrange} alt="Stop" className="h-8 w-8" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Square className="h-4 w-4 text-white" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Center Timeline Area */}
      <div className="flex items-center justify-center min-h-screen px-16">
        <div className="w-full max-w-6xl">
          {/* Timeline visualization for current turn player or leader */}
          {sortedPlayers.length > 0 && sortedPlayers[0].timeline.length > 0 && (
            <div className="bg-black/20 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Leader's Timeline</h2>
                <p className="text-white/70">{sortedPlayers[0].name}</p>
              </div>
              
              <div className="flex gap-2 overflow-x-auto justify-center">
                {sortedPlayers[0].timeline
                  .filter(song => song !== null)
                  .sort((a, b) => parseInt(a.release_year) - parseInt(b.release_year))
                  .map((song, idx) => (
                    <div 
                      key={song.id}
                      className="min-w-[120px] text-center p-4 bg-white/10 border border-white/20 rounded-xl backdrop-blur-sm"
                    >
                      <div className="text-white font-bold text-lg">{song.release_year}</div>
                      <div className="text-white/80 text-sm truncate font-medium">{song.deezer_title}</div>
                      <div className="text-white/60 text-xs truncate">{song.deezer_artist}</div>
                    </div>
                  ))}
              </div>
            </div>
          )}
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