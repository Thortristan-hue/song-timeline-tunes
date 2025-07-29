import React, { useEffect, useState, useMemo } from 'react';
import { Crown, Users, Play, Pause, Music, Check, X } from 'lucide-react';
import { Song, Player } from '@/types/game';
import { RecordMysteryCard } from '@/components/RecordMysteryCard';
import { CassettePlayerDisplay } from '@/components/CassettePlayerDisplay';
import { HostCurrentPlayerTimeline } from '@/components/host/HostCurrentPlayerTimeline';
import { Button } from '@/components/ui/button';
import { getArtistColor, truncateText } from '@/lib/utils';

// Import assets
import assRythmy from '@/assets/ass_rythmy.png';
import assRoomcode from '@/assets/ass_roomcode.png';
import assSpeaker from '@/assets/ass_speaker.png';
import assCassBg from '@/assets/ass_cass_bg.png';
// TODO: Add missing button assets
// import buttonBlue from '@/assets/button_blue.png';
// import buttonOrange from '@/assets/button_orange.png';

// Enhanced Host Feedback Component for clear visual feedback visible only to host
function HostFeedbackOverlay({ 
  show, 
  type 
}: { 
  show: boolean; 
  type: 'correct' | 'incorrect' 
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-20">
      {/* Main background feedback effect */}
      <div className={`w-full h-full transition-all duration-1200 ${
        type === 'correct' ? 'animate-host-feedback-correct' : 'animate-host-feedback-incorrect'
      }`} />
      
      {/* Enhanced visual feedback for correct answers */}
      {type === 'correct' && (
        <>
          {/* Central success indicator */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl animate-bounce text-green-400 font-bold drop-shadow-lg">
              ✓
            </div>
          </div>
          
          {/* Enhanced sparkle effects */}
          <div className="absolute inset-0 flex items-center justify-center">
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 bg-green-400 rounded-full animate-ping opacity-80"
                style={{
                  left: `${50 + Math.cos((i * Math.PI) / 4) * 25}%`,
                  top: `${50 + Math.sin((i * Math.PI) / 4) * 25}%`,
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: '1.2s'
                }}
              />
            ))}
          </div>
          
          {/* Top-right corner indicator for host */}
          <div className="absolute top-4 right-4 bg-green-500/20 backdrop-blur-md rounded-full px-4 py-2 border border-green-400/30">
            <div className="flex items-center gap-2 text-green-400 font-semibold">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Correct!</span>
            </div>
          </div>
        </>
      )}

      {/* Enhanced visual feedback for incorrect answers */}
      {type === 'incorrect' && (
        <>
          {/* Central miss indicator */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl animate-pulse text-red-400 font-bold drop-shadow-lg">
              ✗
            </div>
          </div>
          
          {/* Enhanced error effects */}
          <div className="absolute inset-0 flex items-center justify-center">
            {Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                className="absolute w-4 h-4 bg-red-400/60 rounded-full animate-pulse opacity-70"
                style={{
                  left: `${50 + Math.cos((i * Math.PI) / 3) * 30}%`,
                  top: `${50 + Math.sin((i * Math.PI) / 3) * 30}%`,
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
          
          {/* Top-right corner indicator for host */}
          <div className="absolute top-4 right-4 bg-red-500/20 backdrop-blur-md rounded-full px-4 py-2 border border-red-400/30">
            <div className="flex items-center gap-2 text-red-400 font-semibold">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
              <span>Try Again!</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Enhanced Host Background Component with color gradient
export function HostGameBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Main gradient background with #494252 as primary color */}
      <div
        className="fixed inset-0 w-full h-full"
        style={{
          background: 'linear-gradient(135deg, #494252 0%, #3a3048 25%, #2b2535 50%, #3a3048 75%, #494252 100%)',
          zIndex: 1
        }}
      />
    </div>
  );
}

function HostHeader({ roomCode, playersCount }: { roomCode?: string; playersCount?: number }) {
  const safeRoomCode = roomCode || 'XXXX';
  const safePlayersCount = playersCount || 0;
  return (
    <div className="absolute top-4 left-4 right-4 z-40">
      <div className="flex justify-between items-center">
        {/* Top left: ass_rythmy.png */}
        <div className="flex items-center">
          <div className="w-24 h-24 relative overflow-hidden">
            <img 
              src={assRythmy} 
              alt="Rythmy Logo" 
              className="w-full h-full object-contain drop-shadow-lg"
            />
          </div>
        </div>

        {/* Top right: ass_roomcode.png with room code overlay */}
        <div className="relative">
          <img 
            src={assRoomcode} 
            alt="Room Code Background" 
            className="w-32 h-16 object-contain drop-shadow-lg"
          />
          {/* Room code overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white font-mono text-xl font-black tracking-wider drop-shadow-lg">
              {safeRoomCode}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CassettePlayerSection({
  currentSong,
  mysteryCardRevealed,
  isPlaying,
  onPlayPause,
  cardPlacementResult
}: {
  currentSong: Song | null;
  mysteryCardRevealed: boolean;
  isPlaying: boolean;
  onPlayPause: () => void;
  cardPlacementResult: { correct: boolean; song: Song } | null;
}) {
  const [playClicked, setPlayClicked] = useState(false);
  const [pauseClicked, setPauseClicked] = useState(false);
  const [stopClicked, setStopClicked] = useState(false);

  const handlePlayPause = () => {
    if (isPlaying) {
      setPauseClicked(true);
      setTimeout(() => setPauseClicked(false), 300);
    } else {
      setPlayClicked(true);
      setTimeout(() => setPlayClicked(false), 300);
    }
    onPlayPause();
  };

  const handleStop = () => {
    setStopClicked(true);
    setTimeout(() => setStopClicked(false), 300);
    // Stop functionality would be implemented here
  };

  return (
    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-30">
      <div className="relative">
        {/* Center top: ass_cass_bg.png */}
        <div className="relative">
          <img 
            src={assCassBg} 
            alt="Cassette Player Background" 
            className="w-80 h-48 object-contain drop-shadow-2xl"
          />
          
          {/* Play, Pause, Stop button controls overlayed on cassette */}
          <div className="absolute inset-0 flex items-center justify-center gap-4">
            {/* Play Button */}
            <button
              onClick={handlePlayPause}
              disabled={!currentSong?.preview_url || isPlaying}
              className={`transition-all duration-300 ${playClicked ? 'transform rotate-180' : ''} disabled:opacity-50`}
            >
              <div className="w-12 h-12 bg-blue-500 rounded flex items-center justify-center hover:scale-110 transition-all duration-200">
                <Play className="w-6 h-6 text-white" />
              </div>
            </button>
            
            {/* Pause Button */}
            <button
              onClick={handlePlayPause}
              disabled={!currentSong?.preview_url || !isPlaying}
              className={`transition-all duration-300 ${pauseClicked ? 'transform rotate-180' : ''} disabled:opacity-50`}
            >
              <div className="w-12 h-12 bg-orange-500 rounded flex items-center justify-center hover:scale-110 transition-all duration-200">
                <Pause className="w-6 h-6 text-white" />
              </div>
            </button>
            
            {/* Stop Button */}
            <button
              onClick={handleStop}
              disabled={!currentSong?.preview_url}
              className={`transition-all duration-300 ${stopClicked ? 'transform rotate-180' : ''} disabled:opacity-50`}
            >
              <div className="w-12 h-12 bg-blue-500 rounded flex items-center justify-center hover:scale-110 transition-all duration-200">
                <Music className="w-6 h-6 text-white" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HostTimelineCard({ song, isActive, placementResult }: { 
  song: Song; 
  isActive?: boolean;
  placementResult?: { correct: boolean; song: Song } | null;
}) {
  const cardColor = getArtistColor(song.deezer_artist);
  const [isDropping, setIsDropping] = useState(false);
  const [feedbackAnimation, setFeedbackAnimation] = useState<string>('');
  
  useEffect(() => {
    if (isActive) {
      setIsDropping(true);
      const timer = setTimeout(() => setIsDropping(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  // Trigger host feedback animation when placement result changes
  useEffect(() => {
    if (placementResult && placementResult.song.id === song.id) {
      const animationClass = placementResult.correct 
        ? 'animate-host-feedback-correct' 
        : 'animate-host-feedback-incorrect';
      
      setFeedbackAnimation(animationClass);
      
      // Clear animation after it completes
      setTimeout(() => {
        setFeedbackAnimation('');
      }, 1000);
    }
  }, [placementResult, song.id]);

  return (
    <div 
      className={`w-36 h-36 rounded-2xl flex flex-col items-center justify-between p-4 text-white transition-all duration-700 hover:scale-110 cursor-pointer relative shadow-2xl
        ${isActive ? 'ring-4 ring-green-400 ring-opacity-80 shadow-green-400/30' : ''}
        ${isDropping ? 'animate-ultimate-bang' : ''}
        ${feedbackAnimation}`}
      style={{ 
        backgroundColor: cardColor.backgroundColor,
        backgroundImage: cardColor.backgroundImage,
        boxShadow: '0 12px 35px rgba(0,0,0,0.5)'
      }}
    >
      {/* Artist name - medium, white, wrapped, max 20 letters per line */}
      <div className="text-sm font-medium w-full text-center text-white">
        {truncateText(song.deezer_artist, 20)}
      </div>
      
      {/* Song release year - large, white */}
      <div className="text-4xl font-black my-auto text-white">
        {song.release_year}
      </div>
      
      {/* Song title - small, italic, white, wrapped, max 20 letters per line */}
      <div className="text-xs italic w-full text-center text-white opacity-90">
        {truncateText(song.deezer_title, 20)}
      </div>
      
      <style>{`
        @keyframes ultimate-bang {
          0% {
            transform: scale(0.5) translateY(-120px) rotateZ(-20deg) rotateX(90deg);
            opacity: 0;
            filter: blur(8px);
          }
          25% {
            transform: scale(1.4) translateY(20px) rotateZ(8deg) rotateX(15deg);
            opacity: 0.7;
            filter: blur(3px);
            box-shadow: 0 0 0 25px rgba(255,255,255,0.2), 0 20px 60px rgba(0,0,0,0.7);
          }
          50% {
            transform: scale(0.9) translateY(-12px) rotateZ(-3deg) rotateX(-8deg);
            opacity: 1;
            filter: blur(0px);
            box-shadow: 0 0 0 40px rgba(255,255,255,0.15), 0 25px 70px rgba(0,0,0,0.6);
          }
          75% {
            transform: scale(1.08) translateY(5px) rotateZ(2deg) rotateX(3deg);
            box-shadow: 0 0 0 20px rgba(255,255,255,0.08), 0 15px 45px rgba(0,0,0,0.5);
          }
          100% {
            transform: scale(1) translateY(0) rotateZ(0deg) rotateX(0deg);
            opacity: 1;
            filter: blur(0px);
            box-shadow: 0 0 0 0 rgba(255,255,255,0), 0 12px 35px rgba(0,0,0,0.5);
          }
        }
        .animate-ultimate-bang {
          animation: ultimate-bang 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>
    </div>
  );
}

function HostTimelineDisplay({ 
  currentPlayer, 
  isActive, 
  placementResult,
  highlightedGapIndex
}: { 
  currentPlayer?: Player; 
  isActive?: boolean;
  placementResult?: { correct: boolean; song: Song };
  highlightedGapIndex?: number | null;
}) {
  // Safety checks with better defaults
  const safeCurrentPlayer = currentPlayer || {
    id: 'unknown',
    name: 'Unknown Player',
    timeline: [],
    color: '#ffffff'
  };
  const safeIsActive = isActive ?? true;

  const [visibleCards, setVisibleCards] = useState(0);
  const [newCardIndex, setNewCardIndex] = useState<number | null>(null);
  const [isEntering, setIsEntering] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const cardCount = safeCurrentPlayer.timeline.length;
  const gapSize = Math.max(12, 50 - cardCount * 2);

  useEffect(() => {
    if (safeIsActive) {
      setIsEntering(true);
      setIsExiting(false);
      let count = 0;
      const interval = setInterval(() => {
        count++;
        setVisibleCards(count);
        if (count >= cardCount) clearInterval(interval);
      }, 150);
      
      const enteringTimer = setTimeout(() => setIsEntering(false), 2000);
      
      return () => {
        clearInterval(interval);
        clearTimeout(enteringTimer);
      };
    } else {
      setIsExiting(true);
      setIsEntering(false);
      setVisibleCards(0);
      const exitTimer = setTimeout(() => setIsExiting(false), 1000);
      return () => clearTimeout(exitTimer);
    }
  }, [safeIsActive, cardCount]);

  useEffect(() => {
    if (safeCurrentPlayer.timeline.length > 0 && placementResult) {
      const newIndex = safeCurrentPlayer.timeline.findIndex(
        song => song.id === placementResult.song.id
      );
      if (newIndex >= 0) {
        setNewCardIndex(newIndex);
        setTimeout(() => setNewCardIndex(null), 2000);
      }
    }
  }, [safeCurrentPlayer.timeline, placementResult]);

  return (
    <div 
      className={`flex justify-center items-center p-6 rounded-3xl transition-all duration-1200 ${
        isEntering ? 'animate-epic-timeline-enter' : ''
      } ${isExiting ? 'animate-epic-timeline-exit' : ''}`}
      style={{
        gap: `${gapSize}px`,
        transform: safeIsActive ? 'translateY(0) scale(1)' : 'translateY(60px) scale(0.85)',
        opacity: safeIsActive ? 1 : 0.4,
        filter: safeIsActive ? 'blur(0px)' : 'blur(4px)'
      }}
    >
      {safeCurrentPlayer.timeline.length === 0 ? (
        <div className={`text-white/60 italic py-8 text-xl transition-all duration-1000 ${
          safeIsActive ? 'animate-text-elegant-fade-in' : 'opacity-0'
        }`}>
          {safeCurrentPlayer.name} hasn't placed any cards yet
        </div>
      ) : (
        <>
          {/* Gap before first card */}
          <div 
            className={`w-3 h-32 transition-all duration-300 rounded-xl ${
              highlightedGapIndex === 0 ? 'bg-green-400/30 border-2 border-green-400/60' : ''
            }`}
          />
          
          {safeCurrentPlayer.timeline.map((song, index) => (
            <React.Fragment key={song.id}>
              <div 
                className={`transition-all duration-900 ${index < visibleCards ? 'opacity-100 scale-100' : 'opacity-0 scale-60'} ${
                  newCardIndex === index ? 'animate-epic-card-drop' : ''
                }`}
                style={{
                  transitionDelay: `${index * 100}ms`,
                  transformOrigin: 'bottom center',
                  filter: index < visibleCards ? 'blur(0px)' : 'blur(5px)'
                }}
              >
                <HostTimelineCard 
                  song={song} 
                  isActive={placementResult?.song.id === song.id}
                  placementResult={placementResult}
                />
              </div>
              
              {/* Gap after this card */}
              <div 
                className={`w-3 h-32 transition-all duration-300 rounded-xl ${
                  highlightedGapIndex === index + 1 ? 'bg-green-400/30 border-2 border-green-400/60' : ''
                }`}
              />
            </React.Fragment>
          ))}
        </>
      )}
      
      {placementResult && (
        <div className={`absolute top-full mt-6 text-center text-xl font-black transition-all duration-900 animate-epic-result-appear
          ${placementResult.correct ? 'text-green-400' : 'text-red-400'}`}>
          {placementResult.correct ? (
            <div className="flex items-center gap-3 animate-epic-victory-bounce">
              <Check className="h-8 w-8" /> Perfect Match!
            </div>
          ) : (
            <div className="flex items-center gap-3 animate-epic-gentle-pulse">
              <X className="h-8 w-8" /> Nice Try!
            </div>
          )}
        </div>
      )}
      
      <style>{`
        @keyframes epic-card-drop {
          0% {
            transform: translateY(-300px) scale(0.4) rotateX(180deg) rotateZ(-30deg);
            opacity: 0;
            filter: blur(15px);
          }
          30% {
            transform: translateY(60px) scale(1.5) rotateX(20deg) rotateZ(10deg);
            opacity: 0.6;
            filter: blur(5px);
          }
          60% {
            transform: translateY(-30px) scale(1.15) rotateX(-10deg) rotateZ(-5deg);
            opacity: 1;
            filter: blur(1px);
          }
          80% {
            transform: translateY(15px) scale(1.05) rotateX(5deg) rotateZ(2deg);
          }
          100% {
            transform: translateY(0) scale(1) rotateX(0deg) rotateZ(0deg);
            opacity: 1;
            filter: blur(0px);
          }
        }
        
        @keyframes epic-timeline-enter {
          0% {
            transform: translateX(-150vw) scale(0.6) rotateY(-45deg);
            opacity: 0;
            filter: blur(20px);
          }
          60% {
            transform: translateX(30px) scale(1.1) rotateY(8deg);
            opacity: 0.7;
            filter: blur(5px);
          }
          100% {
            transform: translateX(0) scale(1) rotateY(0deg);
            opacity: 1;
            filter: blur(0px);
          }
        }
        
        @keyframes epic-timeline-exit {
          0% {
            transform: translateX(0) scale(1) rotateY(0deg);
            opacity: 1;
            filter: blur(0px);
          }
          100% {
            transform: translateX(150vw) scale(0.5) rotateY(60deg);
            opacity: 0;
            filter: blur(15px);
          }
        }
        
        @keyframes text-elegant-fade-in {
          0% {
            opacity: 0;
            transform: translateY(40px);
            filter: blur(8px);
          }
          100% {
            opacity: 0.6;
            transform: translateY(0);
            filter: blur(0px);
          }
        }
        
        @keyframes epic-result-appear {
          0% {
            opacity: 0;
            transform: scale(0.3) translateY(-30px);
            filter: blur(10px);
          }
          50% {
            opacity: 1;
            transform: scale(1.3) translateY(-15px);
            filter: blur(2px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
            filter: blur(0px);
          }
        }
        
        @keyframes epic-victory-bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0) scale(1);
          }
          40% {
            transform: translateY(-20px) scale(1.15);
          }
          60% {
            transform: translateY(-10px) scale(1.08);
          }
        }
        
        @keyframes epic-gentle-pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(0.92);
          }
        }
        
        .animate-epic-card-drop {
          animation: epic-card-drop 2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        
        .animate-epic-timeline-enter {
          animation: epic-timeline-enter 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        
        .animate-epic-timeline-exit {
          animation: epic-timeline-exit 1s cubic-bezier(0.55, 0.085, 0.68, 0.53) forwards;
        }
        
        .animate-text-elegant-fade-in {
          animation: text-elegant-fade-in 1s ease-out forwards;
        }
        
        .animate-epic-result-appear {
          animation: epic-result-appear 0.9s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        
        .animate-epic-victory-bounce {
          animation: epic-victory-bounce 2s ease-in-out 4;
        }
        
        .animate-epic-gentle-pulse {
          animation: epic-gentle-pulse 2.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export function HostGameView({
  currentTurnPlayer,
  previousPlayer,
  currentSong,
  roomCode,
  players,
  mysteryCardRevealed,
  isPlaying,
  onPlayPause,
  cardPlacementResult,
  transitioning,
  highlightedGapIndex,
  mobileViewport
}: {
  currentTurnPlayer?: Player;
  previousPlayer?: Player;
  currentSong?: Song | null;
  roomCode?: string;
  players?: Player[];
  mysteryCardRevealed?: boolean;
  isPlaying?: boolean;
  onPlayPause?: () => void;
  cardPlacementResult?: { correct: boolean; song: Song } | null;
  transitioning?: boolean;
  highlightedGapIndex?: number | null;
  mobileViewport?: { startIndex: number; endIndex: number; totalCards: number } | null;
}) {
  // Safety checks and fallbacks with better error handling
  const safeCurrentTurnPlayer = useMemo(() => currentTurnPlayer || {
    id: 'unknown',
    name: 'Unknown Player',
    timeline: [],
    color: '#ffffff',
    timelineColor: '#ffffff',
    score: 0
  }, [currentTurnPlayer]);
  const safePlayers = players || [];
  const safeRoomCode = roomCode || 'XXXX';
  const safeMysteryCardRevealed = mysteryCardRevealed ?? false;
  const safeIsPlaying = isPlaying ?? false;
  const safeTransitioning = transitioning ?? false;
  const safeOnPlayPause = onPlayPause || (() => console.log('Play/Pause not implemented'));

  const [displayedPlayer, setDisplayedPlayer] = useState(safeCurrentTurnPlayer);
  const [animationStage, setAnimationStage] = useState<'idle' | 'exiting' | 'entering'>('idle');
  const [showResultModal, setShowResultModal] = useState(false);
  const [showHostFeedback, setShowHostFeedback] = useState(false);
  
  useEffect(() => {
    if (cardPlacementResult) {
      setShowResultModal(true);
      setShowHostFeedback(true);
      
      const resultTimer = setTimeout(() => {
        setShowResultModal(false);
        // Keep host feedback visible a bit longer for better host awareness
        const hostFeedbackTimer = setTimeout(() => {
          setShowHostFeedback(false);
        }, 2000); // Extra 2 seconds for host feedback after modal closes
        
        setAnimationStage('exiting');
        
        const transitionTimer = setTimeout(() => {
          setDisplayedPlayer(safeCurrentTurnPlayer);
          setAnimationStage('entering');
          
          const enterTimer = setTimeout(() => {
            setAnimationStage('idle');
          }, 1500);
          
          return () => {
            clearTimeout(enterTimer);
            clearTimeout(hostFeedbackTimer);
          };
        }, 1200);
        
        return () => {
          clearTimeout(transitionTimer);
          clearTimeout(hostFeedbackTimer);
        };
      }, 4000);
      
      return () => clearTimeout(resultTimer);
    } else if (safeTransitioning) {
      setAnimationStage('exiting');
      setTimeout(() => {
        setDisplayedPlayer(safeCurrentTurnPlayer);
        setAnimationStage('entering');
        setTimeout(() => setAnimationStage('idle'), 1500);
      }, 1200);
    } else {
      setDisplayedPlayer(safeCurrentTurnPlayer);
    }
  }, [safeCurrentTurnPlayer, safeTransitioning, cardPlacementResult]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Simplified background with only gradient */}
      <HostGameBackground />
      
      {/* Header with required assets */}
      <HostHeader roomCode={safeRoomCode} playersCount={safePlayers.length} />
      
      {/* Center cassette player */}
      <CassettePlayerSection 
        currentSong={currentSong}
        mysteryCardRevealed={safeMysteryCardRevealed}
        isPlaying={safeIsPlaying}
        onPlayPause={safeOnPlayPause}
        cardPlacementResult={cardPlacementResult}
      />
      
      {/* Bottom left speaker */}
      <div className="absolute bottom-6 left-6 z-10">
        <img 
          src={assSpeaker} 
          alt="Left Speaker" 
          className="w-24 h-24 object-contain drop-shadow-lg"
        />
      </div>
      
      {/* Bottom right speaker */}
      <div className="absolute bottom-6 right-6 z-10">
        <img 
          src={assSpeaker} 
          alt="Right Speaker" 
          className="w-24 h-24 object-contain drop-shadow-lg"
        />
      </div>
      
      {/* Host Feedback Overlay */}
      <HostFeedbackOverlay 
        show={showHostFeedback}
        type={cardPlacementResult?.correct ? 'correct' : 'incorrect'}
      />
      
      {/* Timeline - the main content */}
      <div className="absolute top-1/2 left-0 right-0 z-30 mt-8">
        <div className="flex justify-center">
          <HostCurrentPlayerTimeline
            currentTurnPlayer={displayedPlayer}
            previousTurnPlayer={previousPlayer}
            cardPlacementResult={cardPlacementResult}
            highlightedGapIndex={highlightedGapIndex}
            mobileViewport={mobileViewport}
            isTransitioning={animationStage === 'exiting' || animationStage === 'entering'}
          />
        </div>
      </div>

      {/* Player character display at bottom */}
      <div className="absolute bottom-28 left-1/2 transform -translate-x-1/2 z-10">
        <CassettePlayerDisplay 
          players={safePlayers} 
          currentPlayerId={safeCurrentTurnPlayer.id}
        />
      </div>

      {/* Result modal */}
      {showResultModal && cardPlacementResult && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-3xl flex items-center justify-center z-50 animate-epic-modal-appear">
          <div className="text-center space-y-10 p-10 animate-epic-modal-content">
            <div className={`text-9xl mb-8 ${
              cardPlacementResult.correct ? 'animate-epic-success-icon' : 'animate-epic-gentle-float'
            }`}>
              {cardPlacementResult.correct ? '🎯' : '💫'}
            </div>
            <div className={`text-7xl font-black tracking-tight ${
              cardPlacementResult.correct ? 
              'text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400 animate-epic-success-text' : 
              'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 animate-epic-gentle-glow'
            }`}>
              {cardPlacementResult.correct ? 'PERFECT MATCH!' : 'NICE TRY!'}
            </div>
            <div className="bg-white/10 backdrop-blur-3xl rounded-3xl p-10 border border-white/20 max-w-2xl animate-epic-card-rise shadow-3xl">
              <div className="text-4xl font-bold text-white mb-4">
                {cardPlacementResult.song.deezer_title}
              </div>
              <div className="text-3xl text-white/80 mb-8 font-medium">
                by {cardPlacementResult.song.deezer_artist}
              </div>
              <div className="inline-block bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-full font-black text-3xl animate-epic-year-pulse shadow-2xl">
                {cardPlacementResult.song.release_year}
              </div>
            </div>
            <div className="text-white/70 text-2xl animate-epic-text-slide-up">
              {cardPlacementResult.correct ? 
                `${safeCurrentTurnPlayer.name} scored a point!` : 
                `Better luck next time, ${safeCurrentTurnPlayer.name}!`
              }
            </div>
          </div>
          
          <style>{`
            @keyframes epic-modal-appear {
              0% {
                opacity: 0;
                backdrop-filter: blur(0px);
              }
              100% {
                opacity: 1;
                backdrop-filter: blur(12px);
              }
            }
            
            @keyframes epic-modal-content {
              0% {
                opacity: 0;
                transform: scale(0.6) translateY(80px);
                filter: blur(20px);
              }
              100% {
                opacity: 1;
                transform: scale(1) translateY(0);
                filter: blur(0px);
              }
            }
            
            @keyframes epic-success-icon {
              0%, 100% {
                transform: scale(1) rotate(0deg);
              }
              25% {
                transform: scale(1.3) rotate(-15deg);
              }
              50% {
                transform: scale(1.15) rotate(8deg);
              }
              75% {
                transform: scale(1.2) rotate(-5deg);
              }
            }
            
            @keyframes epic-gentle-float {
              0%, 100% {
                transform: translateY(0) rotate(0deg);
              }
              50% {
                transform: translateY(-15px) rotate(8deg);
              }
            }
            
            @keyframes epic-success-text {
              0% {
                transform: scale(0.7);
                filter: brightness(0.7);
              }
              50% {
                transform: scale(1.1);
                filter: brightness(1.5);
              }
              100% {
                transform: scale(1);
                filter: brightness(1);
              }
            }
            
            @keyframes epic-gentle-glow {
              0%, 100% {
                filter: brightness(1);
              }
              50% {
                filter: brightness(1.2);
              }
            }
            
            @keyframes epic-card-rise {
              0% {
                opacity: 0;
                transform: translateY(50px) scale(0.9);
              }
              100% {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
            
            @keyframes epic-year-pulse {
              0%, 100% {
                transform: scale(1);
                box-shadow: 0 0 30px rgba(59, 130, 246, 0.4);
              }
              50% {
                transform: scale(1.08);
                box-shadow: 0 0 50px rgba(59, 130, 246, 0.7);
              }
            }
            
            @keyframes epic-text-slide-up {
              0% {
                opacity: 0;
                transform: translateY(30px);
              }
              100% {
                opacity: 0.7;
                transform: translateY(0);
              }
            }
            
            .animate-epic-modal-appear {
              animation: epic-modal-appear 0.7s ease-out forwards;
            }
            
            .animate-epic-modal-content {
              animation: epic-modal-content 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            }
            
            .animate-epic-success-icon {
              animation: epic-success-icon 2.5s ease-in-out infinite;
            }
            
            .animate-epic-gentle-float {
              animation: epic-gentle-float 4s ease-in-out infinite;
            }
            
            .animate-epic-success-text {
              animation: epic-success-text 2s ease-out forwards;
            }
            
            .animate-epic-gentle-glow {
              animation: epic-gentle-glow 3s ease-in-out infinite;
            }
            
            .animate-epic-card-rise {
              animation: epic-card-rise 1s ease-out 0.4s both;
            }
            
            .animate-epic-year-pulse {
              animation: epic-year-pulse 2.5s ease-in-out infinite;
            }
            
            .animate-epic-text-slide-up {
              animation: epic-text-slide-up 0.8s ease-out 0.6s both;
            }
            
            .shadow-3xl {
              box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.5);
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
