import React, { useState, useEffect, useRef } from 'react';
import { Song } from '@/types/game';
import { useAnimation } from '@/lib/animations';

interface CardPlacementAnimationsProps {
  currentSong: Song;
  isMyTurn: boolean;
  onAnimationComplete?: () => void;
  animationState: 'idle' | 'cassette-to-timeline' | 'timeline-to-cassette' | 'card-falling' | 'incorrect-fall';
  children: React.ReactNode;
}

export function CardPlacementAnimations({
  currentSong,
  isMyTurn,
  onAnimationComplete,
  animationState,
  children
}: CardPlacementAnimationsProps) {
  const [currentAnimation, setCurrentAnimation] = useState<string>('');
  const [showFallingCard, setShowFallingCard] = useState(false);
  const [fallingCardType, setFallingCardType] = useState<'correct' | 'incorrect'>('correct');
  const containerRef = useRef<HTMLDivElement>(null);
  const fallingCardRef = useRef<HTMLDivElement>(null);
  const { animateElement } = useAnimation();

  // Handle animation state changes
  useEffect(() => {
    const handleAnimation = async () => {
      switch (animationState) {
        case 'cassette-to-timeline':
          if (isMyTurn) {
            setCurrentAnimation('animate-cassette-to-timeline');
            setTimeout(() => {
              setCurrentAnimation('animate-cards-spread-out');
              setTimeout(() => {
                setCurrentAnimation('');
                onAnimationComplete?.();
              }, 800);
            }, 1200);
          }
          break;

        case 'timeline-to-cassette':
          setCurrentAnimation('animate-cards-bunch-up');
          setTimeout(() => {
            setCurrentAnimation('animate-timeline-to-cassette');
            setTimeout(() => {
              setCurrentAnimation('');
              onAnimationComplete?.();
            }, 1200);
          }, 800);
          break;

        case 'card-falling':
          setFallingCardType('correct');
          setShowFallingCard(true);
          if (fallingCardRef.current) {
            await animateElement(fallingCardRef, 'CARD_FALL_CORRECT');
            // Trigger thump animation on existing cards
            setCurrentAnimation('animate-cards-make-room');
            setTimeout(() => {
              setCurrentAnimation('animate-card-thump-land');
              setTimeout(() => {
                setShowFallingCard(false);
                setCurrentAnimation('');
                onAnimationComplete?.();
              }, 400);
            }, 300);
          }
          break;

        case 'incorrect-fall':
          setFallingCardType('incorrect');
          setShowFallingCard(true);
          if (fallingCardRef.current) {
            await animateElement(fallingCardRef, 'CARD_FALL_INCORRECT');
            setTimeout(() => {
              setShowFallingCard(false);
              setCurrentAnimation('');
              onAnimationComplete?.();
            }, 2000);
          }
          break;

        case 'idle':
        default:
          setCurrentAnimation('');
          setShowFallingCard(false);
          break;
      }
    };

    if (animationState !== 'idle') {
      handleAnimation();
    }
  }, [animationState, isMyTurn, onAnimationComplete, animateElement]);

  // Generate card background based on artist name
  const getCardStyle = (song: Song) => {
    const artistHash = Array.from(song.deezer_artist).reduce(
      (acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0
    );
    const hue = Math.abs(artistHash) % 360;
    
    return {
      backgroundColor: `hsl(${hue}, 70%, 25%)`,
      backgroundImage: `linear-gradient(135deg, hsl(${hue}, 70%, 20%), hsl(${hue}, 70%, 35%))`,
    };
  };

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {/* Main game content with animation classes */}
      <div className={`w-full h-full transition-all duration-500 ${currentAnimation}`}>
        {children}
      </div>

      {/* Falling card overlay */}
      {showFallingCard && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div
            ref={fallingCardRef}
            className={`absolute w-24 h-32 rounded-xl border-2 border-white/40 flex flex-col items-center justify-between p-2 text-white shadow-2xl ${
              fallingCardType === 'correct' ? 'animate-card-fall-correct' : 'animate-card-fall-incorrect'
            }`}
            style={{
              left: '50%',
              top: '-100vh',
              transform: 'translateX(-50%)',
              ...getCardStyle(currentSong)
            }}
          >
            {/* Artist name */}
            <div className="text-xs font-bold text-center w-full leading-tight">
              {currentSong.deezer_artist.length > 12 
                ? currentSong.deezer_artist.substring(0, 12) + '...' 
                : currentSong.deezer_artist}
            </div>
            
            {/* Year */}
            <div className="text-xl font-black text-center">
              {currentSong.release_year}
            </div>
            
            {/* Song title */}
            <div className="text-xs italic text-center w-full leading-tight text-white/90">
              {currentSong.deezer_title.length > 14 
                ? currentSong.deezer_title.substring(0, 14) + '...' 
                : currentSong.deezer_title}
            </div>
          </div>
        </div>
      )}

      {/* Visual effects for enhanced feedback */}
      {animationState === 'card-falling' && (
        <div className="fixed inset-0 pointer-events-none z-40">
          {/* Sparkle effects for correct placement */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
                style={{
                  left: `${Math.cos((i * Math.PI) / 4) * 50}px`,
                  top: `${Math.sin((i * Math.PI) / 4) * 50}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        </div>
      )}

      {animationState === 'incorrect-fall' && (
        <div className="fixed inset-0 pointer-events-none z-40">
          {/* Smoke/error effects for incorrect placement */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            {Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 bg-red-500/70 rounded-full animate-pulse"
                style={{
                  left: `${Math.cos((i * Math.PI) / 3) * 30}px`,
                  top: `${Math.sin((i * Math.PI) / 3) * 30}px`,
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: '0.8s'
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}