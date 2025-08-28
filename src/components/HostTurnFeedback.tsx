import React, { useEffect, useState } from 'react';
import { Song, Player } from '@/types/game';
import { CheckCircle, XCircle, Star, Zap, Music } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HostTurnFeedbackProps {
  isVisible: boolean;
  player: Player;
  song: Song;
  isCorrect: boolean;
  onComplete: () => void;
  duration?: number;
}

export function HostTurnFeedback({
  isVisible,
  player,
  song,
  isCorrect,
  onComplete,
  duration = 4000
}: HostTurnFeedbackProps) {
  const [phase, setPhase] = useState<'enter' | 'show' | 'exit'>('enter');

  useEffect(() => {
    if (!isVisible) return;

    // Animation sequence
    setPhase('enter');
    
    const showTimer = setTimeout(() => {
      setPhase('show');
    }, 500);

    const exitTimer = setTimeout(() => {
      setPhase('exit');
    }, duration - 800);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [isVisible, duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center transition-all duration-700",
      "bg-gradient-to-br backdrop-blur-md",
      phase === 'enter' && "animate-in fade-in zoom-in-95",
      phase === 'exit' && "animate-out fade-out zoom-out-95",
      isCorrect 
        ? 'from-emerald-500/95 via-green-500/95 to-teal-600/95' 
        : 'from-red-500/95 via-rose-500/95 to-pink-600/95'
    )}>
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating particles */}
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "absolute rounded-full animate-bounce opacity-60",
              isCorrect 
                ? i % 3 === 0 ? "bg-yellow-300" : i % 3 === 1 ? "bg-green-300" : "bg-white"
                : i % 2 === 0 ? "bg-red-300" : "bg-pink-300"
            )}
            style={{
              width: `${Math.random() * 16 + 4}px`,
              height: `${Math.random() * 16 + 4}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${1.5 + Math.random() * 2}s`,
            }}
          />
        ))}

        {/* Pulse rings */}
        <div className={cn(
          "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
          "w-96 h-96 rounded-full opacity-30 animate-ping",
          isCorrect ? "bg-white" : "bg-yellow-200"
        )} />
        <div className={cn(
          "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
          "w-80 h-80 rounded-full opacity-25 animate-ping",
          isCorrect ? "bg-yellow-300" : "bg-red-300"
        )} style={{ animationDelay: '0.5s' }} />
      </div>

      <div className="relative text-center text-white max-w-4xl mx-auto px-8">
        {/* Main feedback content */}
        <div className={cn(
          "transition-all duration-500",
          phase === 'enter' && "animate-in slide-in-from-bottom-8",
          phase === 'show' && "animate-pulse",
          phase === 'exit' && "animate-out slide-out-to-top-8"
        )}>
          {/* Large icon */}
          <div className="mb-8">
            {isCorrect ? (
              <div className="flex items-center justify-center space-x-4">
                <Star className="h-24 w-24 text-yellow-300 animate-bounce" />
                <CheckCircle className="h-32 w-32 text-white animate-pulse drop-shadow-2xl" />
                <Star className="h-24 w-24 text-yellow-300 animate-bounce" style={{ animationDelay: '0.3s' }} />
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-4">
                <Zap className="h-24 w-24 text-red-300 animate-pulse" />
                <XCircle className="h-32 w-32 text-white animate-bounce drop-shadow-2xl" />
                <Zap className="h-24 w-24 text-red-300 animate-pulse" style={{ animationDelay: '0.3s' }} />
              </div>
            )}
          </div>

          {/* Player name and result */}
          <div className="mb-8">
            <h1 className="text-6xl md:text-8xl font-black mb-4 drop-shadow-2xl animate-in slide-in-from-left duration-700">
              {player.name}
            </h1>
            <h2 className={cn(
              "text-4xl md:text-6xl font-bold drop-shadow-xl animate-in slide-in-from-right duration-700 delay-200",
              isCorrect ? "text-yellow-300" : "text-red-200"
            )}>
              {isCorrect ? 'PERFECT PLACEMENT!' : 'NICE TRY!'}
            </h2>
          </div>

          {/* Song information */}
          <div className="bg-black/30 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl animate-in zoom-in duration-700 delay-500">
            <div className="flex items-center justify-center mb-6">
              <Music className="h-8 w-8 mr-3 text-white" />
              <span className="text-2xl font-semibold">Mystery Song Revealed</span>
            </div>
            
            <div className="space-y-4">
              <div className="text-3xl md:text-4xl font-bold">
                "{song.deezer_title}"
              </div>
              <div className="text-xl md:text-2xl opacity-90">
                by {song.deezer_artist}
              </div>
              <div className={cn(
                "inline-block px-6 py-3 rounded-2xl font-black text-2xl border-2",
                isCorrect 
                  ? "bg-green-500 border-green-300 text-white" 
                  : "bg-red-500 border-red-300 text-white"
              )}>
                Released: {song.release_year}
              </div>
              {song.deezer_album && (
                <div className="text-lg opacity-80 italic">
                  from "{song.deezer_album}"
                </div>
              )}
            </div>
          </div>

          {/* Motivational message */}
          {phase === 'show' && (
            <div className="mt-8 text-2xl font-semibold animate-in fade-in duration-1000 delay-1000">
              {isCorrect 
                ? "🎉 Timeline expertise! Next mystery card coming up..." 
                : "💪 Keep building that timeline! Next song loading..."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}