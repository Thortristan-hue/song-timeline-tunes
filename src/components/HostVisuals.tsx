import React, { useEffect, useState } from 'react';
import { Crown, Users, Play, Pause, Music, Check, X } from 'lucide-react';
import { Song, Player } from '@/types/game';
import { RecordMysteryCard } from '@/components/RecordMysteryCard';
import { CassettePlayerDisplay } from '@/components/CassettePlayerDisplay';

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

function HostHeader({ roomCode, playersCount }: { roomCode: string; playersCount: number }) {
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

function RecordPlayerSection({
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

function HostTimelineCard({ song, isActive }: { song: Song; isActive?: boolean }) {
  const artistHash = Array.from(song.deezer_artist).reduce(
    (acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0
  );
  const hue = Math.abs(artistHash) % 360;
  const [isDropping, setIsDropping] = useState(false);
  
  useEffect(() => {
    if (isActive) {
      setIsDropping(true);
      const timer = setTimeout(() => setIsDropping(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  return (
    <div 
      className={`w-32 h-32 rounded-xl flex flex-col items-center justify-between p-3 text-white transition-all duration-500 hover:scale-110 cursor-pointer relative
        ${isActive ? 'ring-4 ring-green-400 ring-opacity-80' : ''}
        ${isDropping ? 'animate-dramatic-bang' : ''}`}
      style={{ 
        backgroundColor: `hsl(${hue}, 70%, 30%)`,
        backgroundImage: `linear-gradient(135deg, hsl(${hue}, 70%, 25%), hsl(${hue}, 70%, 40%))`,
        boxShadow: '0 8px 25px rgba(0,0,0,0.4)'
      }}
    >
      <div className="text-sm font-medium w-full text-center truncate">
        {song.deezer_artist}
      </div>
      <div className="text-3xl font-bold my-auto">
        {song.release_year}
      </div>
      <div className="text-xs italic w-full text-center truncate">
        {song.deezer_title}
      </div>
      
      <style jsx global>{`
        @keyframes dramatic-bang {
          0% {
            transform: scale(0.6) translateY(-80px) rotateZ(-15deg);
            opacity: 0;
            filter: blur(3px);
          }
          25% {
            transform: scale(1.3) translateY(15px) rotateZ(5deg);
            opacity: 0.8;
            filter: blur(1px);
            box-shadow: 0 0 0 20px rgba(255,255,255,0.15), 0 15px 40px rgba(0,0,0,0.6);
          }
          50% {
            transform: scale(0.9) translateY(-8px) rotateZ(-2deg);
            opacity: 1;
            filter: blur(0px);
            box-shadow: 0 0 0 30px rgba(255,255,255,0.1), 0 20px 50px rgba(0,0,0,0.5);
          }
          75% {
            transform: scale(1.05) translateY(3px) rotateZ(1deg);
            box-shadow: 0 0 0 15px rgba(255,255,255,0.05), 0 12px 30px rgba(0,0,0,0.4);
          }
          100% {
            transform: scale(1) translateY(0) rotateZ(0deg);
            opacity: 1;
            filter: blur(0px);
            box-shadow: 0 0 0 0 rgba(255,255,255,0), 0 8px 25px rgba(0,0,0,0.4);
          }
        }
        .animate-dramatic-bang {
          animation: dramatic-bang 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>
    </div>
  );
}

function HostTimelineDisplay({ 
  currentPlayer, 
  isActive, 
  placementResult 
}: { 
  currentPlayer: Player; 
  isActive: boolean;
  placementResult?: { correct: boolean; song: Song };
}) {
  const [visibleCards, setVisibleCards] = useState(0);
  const [newCardIndex, setNewCardIndex] = useState<number | null>(null);
  const [isEntering, setIsEntering] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const cardCount = currentPlayer.timeline.length;
  const gapSize = Math.max(8, 40 - cardCount * 2);

  useEffect(() => {
    if (isActive) {
      setIsEntering(true);
      setIsExiting(false);
      let count = 0;
      const interval = setInterval(() => {
        count++;
        setVisibleCards(count);
        if (count >= cardCount) clearInterval(interval);
      }, 120);
      
      const enteringTimer = setTimeout(() => setIsEntering(false), 1500);
      
      return () => {
        clearInterval(interval);
        clearTimeout(enteringTimer);
      };
    } else {
      setIsExiting(true);
      setIsEntering(false);
      setVisibleCards(0);
      const exitTimer = setTimeout(() => setIsExiting(false), 800);
      return () => clearTimeout(exitTimer);
    }
  }, [isActive, cardCount]);

  useEffect(() => {
    if (currentPlayer.timeline.length > 0 && placementResult) {
      const newIndex = currentPlayer.timeline.findIndex(
        song => song.id === placementResult.song.id
      );
      if (newIndex >= 0) {
        setNewCardIndex(newIndex);
        setTimeout(() => setNewCardIndex(null), 1500);
      }
    }
  }, [currentPlayer.timeline, placementResult]);

  return (
    <div 
      className={`flex justify-center items-center p-4 rounded-2xl transition-all duration-1000 ${
        isEntering ? 'animate-timeline-enter' : ''
      } ${isExiting ? 'animate-timeline-exit' : ''}`}
      style={{
        gap: `${gapSize}px`,
        transform: isActive ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.9)',
        opacity: isActive ? 1 : 0.5,
        filter: isActive ? 'blur(0px)' : 'blur(2px)'
      }}
    >
      {currentPlayer.timeline.length === 0 ? (
        <div className={`text-white/50 italic py-6 text-lg transition-all duration-800 ${
          isActive ? 'animate-text-fade-in' : 'opacity-0'
        }`}>
          {currentPlayer.name} hasn't placed any cards yet
        </div>
      ) : (
        currentPlayer.timeline.map((song, index) => (
          <div 
            key={song.id}
            className={`transition-all duration-700 ${index < visibleCards ? 'opacity-100 scale-100' : 'opacity-0 scale-50'} ${
              newCardIndex === index ? 'animate-massive-card-drop' : ''
            }`}
            style={{
              transitionDelay: `${index * 80}ms`,
              transformOrigin: 'bottom center',
              filter: index < visibleCards ? 'blur(0px)' : 'blur(3px)'
            }}
          >
            <HostTimelineCard 
              song={song} 
              isActive={placementResult?.song.id === song.id}
            />
          </div>
        ))
      )}
      
      {placementResult && (
        <div className={`absolute top-full mt-4 text-center text-lg font-bold transition-all duration-700 animate-result-appear
          ${placementResult.correct ? 'text-green-400' : 'text-red-400'}`}>
          {placementResult.correct ? (
            <div className="flex items-center gap-2 animate-victory-bounce">
              <Check className="h-6 w-6" /> Correct!
            </div>
          ) : (
            <div className="flex items-center gap-2 animate-gentle-pulse">
              <X className="h-6 w-6" /> Incorrect
            </div>
          )}
        </div>
      )}
      
      <style jsx global>{`
        @keyframes massive-card-drop {
          0% {
            transform: translateY(-200px) scale(0.5) rotateX(90deg);
            opacity: 0;
            filter: blur(8px);
          }
          30% {
            transform: translateY(40px) scale(1.4) rotateX(10deg);
            opacity: 0.7;
            filter: blur(2px);
          }
          60% {
            transform: translateY(-20px) scale(1.1) rotateX(-5deg);
            opacity: 1;
            filter: blur(0px);
          }
          80% {
            transform: translateY(8px) scale(1.03) rotateX(2deg);
          }
          100% {
            transform: translateY(0) scale(1) rotateX(0deg);
            opacity: 1;
            filter: blur(0px);
          }
        }
        
        @keyframes timeline-enter {
          0% {
            transform: translateX(-100vw) scale(0.8) rotateY(-20deg);
            opacity: 0;
            filter: blur(10px);
          }
          60% {
            transform: translateX(20px) scale(1.05) rotateY(5deg);
            opacity: 0.8;
            filter: blur(2px);
          }
          100% {
            transform: translateX(0) scale(1) rotateY(0deg);
            opacity: 1;
            filter: blur(0px);
          }
        }
        
        @keyframes timeline-exit {
          0% {
            transform: translateX(0) scale(1) rotateY(0deg);
            opacity: 1;
            filter: blur(0px);
          }
          100% {
            transform: translateX(100vw) scale(0.7) rotateY(30deg);
            opacity: 0;
            filter: blur(8px);
          }
        }
        
        @keyframes text-fade-in {
          0% {
            opacity: 0;
            transform: translateY(30px);
            filter: blur(3px);
          }
          100% {
            opacity: 0.5;
            transform: translateY(0);
            filter: blur(0px);
          }
        }
        
        @keyframes result-appear {
          0% {
            opacity: 0;
            transform: scale(0.5) translateY(-20px);
            filter: blur(5px);
          }
          50% {
            opacity: 1;
            transform: scale(1.2) translateY(-10px);
            filter: blur(1px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
            filter: blur(0px);
          }
        }
        
        @keyframes victory-bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0) scale(1);
          }
          40% {
            transform: translateY(-15px) scale(1.1);
          }
          60% {
            transform: translateY(-8px) scale(1.05);
          }
        }
        
        @keyframes gentle-pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(0.95);
          }
        }
        
        .animate-massive-card-drop {
          animation: massive-card-drop 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        
        .animate-timeline-enter {
          animation: timeline-enter 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        
        .animate-timeline-exit {
          animation: timeline-exit 0.8s cubic-bezier(0.55, 0.085, 0.68, 0.53) forwards;
        }
        
        .animate-text-fade-in {
          animation: text-fade-in 0.8s ease-out forwards;
        }
        
        .animate-result-appear {
          animation: result-appear 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        
        .animate-victory-bounce {
          animation: victory-bounce 1.5s ease-in-out 3;
        }
        
        .animate-gentle-pulse {
          animation: gentle-pulse 2s ease-in-out infinite;
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
  transitioning
}: {
  currentTurnPlayer: Player;
  previousPlayer?: Player;
  currentSong: Song | null;
  roomCode: string;
  players: Player[];
  mysteryCardRevealed: boolean;
  isPlaying: boolean;
  onPlayPause: () => void;
  cardPlacementResult: { correct: boolean; song: Song } | null;
  transitioning: boolean;
}) {
  const [displayedPlayer, setDisplayedPlayer] = useState(currentTurnPlayer);
  const [animationStage, setAnimationStage] = useState<'idle' | 'exiting' | 'entering'>('idle');
  const [showResultModal, setShowResultModal] = useState(false);
  
  // Handle card placement result and transitions
  useEffect(() => {
    if (cardPlacementResult) {
      // Show the result modal for 3 seconds before starting transition
      setShowResultModal(true);
      const resultTimer = setTimeout(() => {
        setShowResultModal(false);
        setAnimationStage('exiting');
        
        // Wait for exit animation to complete before switching players
        const transitionTimer = setTimeout(() => {
          setDisplayedPlayer(currentTurnPlayer);
          setAnimationStage('entering');
          
          // Wait for enter animation to complete
          const enterTimer = setTimeout(() => {
            setAnimationStage('idle');
          }, 1200);
          
          return () => clearTimeout(enterTimer);
        }, 1000);
        
        return () => clearTimeout(transitionTimer);
      }, 3000);
      
      return () => clearTimeout(resultTimer);
    } else if (transitioning) {
      // Regular transition without placement result
      setAnimationStage('exiting');
      setTimeout(() => {
        setDisplayedPlayer(currentTurnPlayer);
        setAnimationStage('entering');
        setTimeout(() => setAnimationStage('idle'), 1200);
      }, 1000);
    } else {
      setDisplayedPlayer(currentTurnPlayer);
    }
  }, [currentTurnPlayer, transitioning, cardPlacementResult]);

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
      
      <div className="absolute top-1/2 left-0 right-0 z-30 mt-4">
        <div className="flex justify-center">
          <HostTimelineDisplay 
            currentPlayer={displayedPlayer} 
            isActive={animationStage !== 'exiting'}
            placementResult={cardPlacementResult}
          />
        </div>
      </div>

      <div className="absolute bottom-4 left-4 right-4 z-10">
        <CassettePlayerDisplay 
          players={players} 
          currentPlayerId={currentTurnPlayer.id}
        />
      </div>

      {showResultModal && cardPlacementResult && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-3xl flex items-center justify-center z-50 animate-modal-appear">
          <div className="text-center space-y-8 p-8 animate-modal-content">
            <div className={`text-9xl mb-6 ${
              cardPlacementResult.correct ? 'animate-success-icon' : 'animate-gentle-float'
            }`}>
              {cardPlacementResult.correct ? '🎯' : '💫'}
            </div>
            <div className={`text-6xl font-black tracking-tight ${
              cardPlacementResult.correct ? 
              'text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400 animate-success-text' : 
              'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 animate-gentle-glow'
            }`}>
              {cardPlacementResult.correct ? 'PERFECT MATCH!' : 'NICE TRY!'}
            </div>
            <div className="bg-white/10 backdrop-blur-3xl rounded-3xl p-8 border border-white/20 max-w-lg animate-card-rise">
              <div className="text-3xl font-bold text-white mb-3">
                {cardPlacementResult.song.deezer_title}
              </div>
              <div className="text-2xl text-white/80 mb-6 font-medium">
                by {cardPlacementResult.song.deezer_artist}
              </div>
              <div className="inline-block bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-full font-bold text-2xl animate-year-pulse">
                {cardPlacementResult.song.release_year}
              </div>
            </div>
            <div className="text-white/60 text-xl animate-text-slide-up">
              {cardPlacementResult.correct ? 
                `${currentTurnPlayer.name} scored a point!` : 
                `Better luck next time, ${currentTurnPlayer.name}!`
              }
            </div>
          </div>
          
          <style jsx global>{`
            @keyframes modal-appear {
              0% {
                opacity: 0;
                backdrop-filter: blur(0px);
              }
              100% {
                opacity: 1;
                backdrop-filter: blur(12px);
              }
            }
            
            @keyframes modal-content {
              0% {
                opacity: 0;
                transform: scale(0.7) translateY(50px);
                filter: blur(10px);
              }
              100% {
                opacity: 1;
                transform: scale(1) translateY(0);
                filter: blur(0px);
              }
            }
            
            @keyframes success-icon {
              0%, 100% {
                transform: scale(1) rotate(0deg);
              }
              25% {
                transform: scale(1.2) rotate(-10deg);
              }
              50% {
                transform: scale(1.1) rotate(5deg);
              }
              75% {
                transform: scale(1.15) rotate(-3deg);
              }
            }
            
            @keyframes gentle-float {
              0%, 100% {
                transform: translateY(0) rotate(0deg);
              }
              50% {
                transform: translateY(-10px) rotate(5deg);
              }
            }
            
            @keyframes success-text {
              0% {
                transform: scale(0.8);
                filter: brightness(0.8);
              }
              50% {
                transform: scale(1.05);
                filter: brightness(1.3);
              }
              100% {
                transform: scale(1);
                filter: brightness(1);
              }
            }
            
            @keyframes gentle-glow {
              0%, 100% {
                filter: brightness(1);
              }
              50% {
                filter: brightness(1.1);
              }
            }
            
            @keyframes card-rise {
              0% {
                opacity: 0;
                transform: translateY(30px) scale(0.95);
              }
              100% {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
            
            @keyframes year-pulse {
              0%, 100% {
                transform: scale(1);
                box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
              }
              50% {
                transform: scale(1.05);
                box-shadow: 0 0 30px rgba(59, 130, 246, 0.5);
              }
            }
            
            @keyframes text-slide-up {
              0% {
                opacity: 0;
                transform: translateY(20px);
              }
              100% {
                opacity: 0.6;
                transform: translateY(0);
              }
            }
            
            .animate-modal-appear {
              animation: modal-appear 0.5s ease-out forwards;
            }
            
            .animate-modal-content {
              animation: modal-content 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            }
            
            .animate-success-icon {
              animation: success-icon 2s ease-in-out infinite;
            }
            
            .animate-gentle-float {
              animation: gentle-float 3s ease-in-out infinite;
            }
            
            .animate-success-text {
              animation: success-text 1.5s ease-out forwards;
            }
            
            .animate-gentle-glow {
              animation: gentle-glow 2s ease-in-out infinite;
            }
            
            .animate-card-rise {
              animation: card-rise 0.8s ease-out 0.3s both;
            }
            
            .animate-year-pulse {
              animation: year-pulse 2s ease-in-out infinite;
            }
            
            .animate-text-slide-up {
              animation: text-slide-up 0.6s ease-out 0.5s both;
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
