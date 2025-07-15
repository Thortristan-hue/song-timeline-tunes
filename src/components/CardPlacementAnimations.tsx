import React, { useState, useEffect, useRef } from 'react';
import { Song } from '@/types/game';
import { useAnimation } from '@/lib/animations';

interface CardPlacementAnimationsProps {
  currentSong: Song;
  isMyTurn: boolean;
  onAnimationComplete?: () => void;
  animationState: 'idle' | 'cassette-to-timeline' | 'timeline-to-cassette' | 'card-falling' | 'incorrect-fall';
  children: React.ReactNode;
  showHostFeedback?: boolean;
  hostFeedbackType?: 'correct' | 'incorrect';
}

export function CardPlacementAnimations({
  currentSong,
  isMyTurn,
  onAnimationComplete,
  animationState,
  children,
  showHostFeedback = false,
  hostFeedbackType = 'correct'
}: CardPlacementAnimationsProps) {
  const [currentAnimation, setCurrentAnimation] = useState<string>('');
  const [showFallingCard, setShowFallingCard] = useState(false);
  const [fallingCardType, setFallingCardType] = useState<'correct' | 'incorrect'>('correct');
  const [showSparkles, setShowSparkles] = useState(false);
  const [showSmokeEffect, setShowSmokeEffect] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fallingCardRef = useRef<HTMLDivElement>(null);
  const { animateElement } = useAnimation();

  // Handle animation state changes with enhanced sequencing
  useEffect(() => {
    const handleAnimation = async () => {
      switch (animationState) {
        case 'cassette-to-timeline':
          if (isMyTurn) {
            // Enhanced turn start sequence
            setCurrentAnimation('animate-cassette-to-timeline');
            setTimeout(() => {
              setCurrentAnimation('animate-cards-spread-out');
              setTimeout(() => {
                setCurrentAnimation('animate-cards-anticipation');
                setTimeout(() => {
                  setCurrentAnimation('');
                  onAnimationComplete?.();
                }, 400);
              }, 800);
            }, 1200);
          }
          break;

        case 'timeline-to-cassette':
          // Enhanced turn end sequence
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
          setShowSparkles(true);
          
          if (fallingCardRef.current) {
            // Trigger make room animation for existing cards first
            setCurrentAnimation('animate-cards-make-room');
            
            // Start the card fall animation
            await animateElement(fallingCardRef, 'CARD_FALL_CORRECT');
            
            // Landing thump animation
            setTimeout(() => {
              setCurrentAnimation('animate-card-thump-land');
              setTimeout(() => {
                setShowFallingCard(false);
                setShowSparkles(false);
                setCurrentAnimation('');
                onAnimationComplete?.();
              }, 600);
            }, 100);
          }
          break;

        case 'incorrect-fall':
          setFallingCardType('incorrect');
          setShowFallingCard(true);
          setShowSmokeEffect(true);
          
          if (fallingCardRef.current) {
            // No room making for incorrect placements
            await animateElement(fallingCardRef, 'CARD_FALL_INCORRECT');
            setTimeout(() => {
              setShowFallingCard(false);
              setShowSmokeEffect(false);
              setCurrentAnimation('');
              onAnimationComplete?.();
            }, 500);
          }
          break;

        case 'idle':
        default:
          setCurrentAnimation('');
          setShowFallingCard(false);
          setShowSparkles(false);
          setShowSmokeEffect(false);
          break;
      }
    };

    if (animationState !== 'idle') {
      handleAnimation();
    }
  }, [animationState, isMyTurn, onAnimationComplete, animateElement]);

  // Generate enhanced card background with more sophisticated styling
  const getCardStyle = (song: Song) => {
    const artistHash = Array.from(song.deezer_artist).reduce(
      (acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0
    );
    const hue = Math.abs(artistHash) % 360;
    
    return {
      backgroundColor: `hsl(${hue}, 70%, 25%)`,
      backgroundImage: `
        linear-gradient(135deg, hsl(${hue}, 70%, 20%), hsl(${hue}, 70%, 35%)),
        radial-gradient(circle at 30% 30%, hsla(${hue}, 50%, 50%, 0.2), transparent 50%)
      `,
      borderImage: `linear-gradient(45deg, hsl(${hue}, 80%, 40%), hsl(${hue}, 60%, 30%)) 1`,
    };
  };

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {/* Main game content with enhanced animation classes */}
      <div className={`w-full h-full transition-all duration-500 ${currentAnimation} ${
        showHostFeedback ? (hostFeedbackType === 'correct' ? 'animate-host-feedback-correct' : 'animate-host-feedback-incorrect') : ''
      }`}>
        {children}
      </div>

      {/* Enhanced falling card overlay with improved physics */}
      {showFallingCard && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div
            ref={fallingCardRef}
            className={`absolute w-28 h-36 rounded-xl border-2 flex flex-col items-center justify-between p-3 text-white shadow-2xl transform-gpu ${
              fallingCardType === 'correct' ? 'animate-card-fall-correct border-green-400/60' : 'animate-card-fall-incorrect border-red-400/60'
            }`}
            style={{
              left: '50%',
              top: '-120vh',
              transform: 'translateX(-50%)',
              ...getCardStyle(currentSong),
              backdropFilter: 'blur(1px)',
              boxShadow: fallingCardType === 'correct' 
                ? '0 0 30px rgba(34, 197, 94, 0.6), 0 20px 40px rgba(0, 0, 0, 0.3)'
                : '0 0 30px rgba(239, 68, 68, 0.6), 0 20px 40px rgba(0, 0, 0, 0.3)'
            }}
          >
            {/* Enhanced card content */}
            <div className="text-xs font-bold text-center w-full leading-tight drop-shadow-sm">
              {currentSong.deezer_artist.length > 14 
                ? currentSong.deezer_artist.substring(0, 14) + '...' 
                : currentSong.deezer_artist}
            </div>
            
            <div className="text-2xl font-black text-center drop-shadow-md">
              {currentSong.release_year}
            </div>
            
            <div className="text-xs italic text-center w-full leading-tight text-white/95 drop-shadow-sm">
              {currentSong.deezer_title.length > 16 
                ? currentSong.deezer_title.substring(0, 16) + '...' 
                : currentSong.deezer_title}
            </div>

            {/* Card glow effect */}
            <div className={`absolute inset-0 rounded-xl pointer-events-none ${
              fallingCardType === 'correct' ? 'bg-green-400/10' : 'bg-red-400/10'
            }`} />
          </div>
        </div>
      )}

      {/* Enhanced sparkle effects for correct placement */}
      {showSparkles && animationState === 'card-falling' && (
        <div className="fixed inset-0 pointer-events-none z-40">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            {Array.from({ length: 12 }, (_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-ping"
                style={{
                  left: `${Math.cos((i * Math.PI) / 6) * (60 + Math.random() * 20)}px`,
                  top: `${Math.sin((i * Math.PI) / 6) * (60 + Math.random() * 20)}px`,
                  animationDelay: `${i * 0.1 + Math.random() * 0.2}s`,
                  animationDuration: `${1 + Math.random() * 0.5}s`,
                  transform: `scale(${0.8 + Math.random() * 0.4})`
                }}
              />
            ))}
            
            {/* Central burst effect */}
            <div className="absolute w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-pulse opacity-80 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
        </div>
      )}

      {/* Enhanced smoke/error effects for incorrect placement */}
      {showSmokeEffect && animationState === 'incorrect-fall' && (
        <div className="fixed inset-0 pointer-events-none z-40">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                className="absolute w-4 h-4 bg-gradient-to-r from-red-500/80 to-orange-500/60 rounded-full animate-pulse"
                style={{
                  left: `${Math.cos((i * Math.PI) / 4) * (40 + Math.random() * 30)}px`,
                  top: `${Math.sin((i * Math.PI) / 4) * (40 + Math.random() * 30)}px`,
                  animationDelay: `${i * 0.15 + Math.random() * 0.3}s`,
                  animationDuration: `${0.8 + Math.random() * 0.4}s`,
                  transform: `scale(${0.6 + Math.random() * 0.6})`,
                  filter: 'blur(1px)'
                }}
              />
            ))}
            
            {/* X mark for incorrect */}
            <div className="absolute transform -translate-x-1/2 -translate-y-1/2 text-red-400 text-4xl font-bold animate-pulse">
              ✗
            </div>
          </div>
        </div>
      )}

      {/* Timeline highlight effect during placement */}
      {(animationState === 'card-falling' || animationState === 'incorrect-fall') && (
        <div className="absolute inset-0 pointer-events-none z-30">
          <div className="w-full h-full animate-timeline-highlight" />
        </div>
      )}
    </div>
  );
}