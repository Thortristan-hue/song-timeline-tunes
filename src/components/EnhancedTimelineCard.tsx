import React, { useState, useEffect, useRef } from 'react';
import { Song } from '@/types/game';
import { cn } from '@/lib/utils';
import { useAnimationSystem } from '@/lib/AnimationSystem';

interface EnhancedTimelineCardProps {
  song: Song;
  index: number;
  isHighlighted?: boolean;
  isSelected?: boolean;
  onHover?: (index: number | null) => void;
  onClick?: (index: number) => void;
  showShimmer?: boolean;
  className?: string;
}

export function EnhancedTimelineCard({
  song,
  index,
  isHighlighted = false,
  isSelected = false,
  onHover,
  onClick,
  showShimmer = false,
  className = ""
}: EnhancedTimelineCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number}>>([]);
  const cardRef = useRef<HTMLDivElement>(null);
  const { animateElement, getCSSClass } = useAnimationSystem();

  // Generate artist-based color
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
      borderColor: `hsl(${hue}, 80%, 40%)`,
    };
  };

  // Handle hover effects
  const handleMouseEnter = async () => {
    setIsHovered(true);
    onHover?.(index);
    
    // Trigger shimmer animation
    if (cardRef.current) {
      await animateElement(cardRef, 'CARD_SHIMMER');
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onHover?.(null);
  };

  // Handle click with magnetic snap effect
  const handleClick = async () => {
    if (cardRef.current) {
      await animateElement(cardRef, 'MAGNETIC_SNAP');
    }
    onClick?.(index);
  };

  // Success particle effect
  useEffect(() => {
    if (isSelected) {
      const newParticles = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
      }));
      setParticles(newParticles);
      
      // Clear particles after animation
      const timer = setTimeout(() => setParticles([]), 1500);
      return () => clearTimeout(timer);
    }
  }, [isSelected]);

  return (
    <div className="relative">
      {/* Main Card */}
      <div
        ref={cardRef}
        className={cn(
          "relative w-20 h-28 rounded-lg border-2 flex flex-col items-center justify-between p-2 text-white cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95",
          "hover:shadow-lg hover:shadow-white/20",
          isHighlighted && "ring-2 ring-green-400 ring-opacity-70",
          isSelected && "ring-2 ring-blue-400 ring-opacity-90",
          showShimmer && getCSSClass('CARD_SHIMMER'),
          className
        )}
        style={getCardStyle(song)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {/* Artist Name */}
        <div className="text-xs font-bold text-center w-full leading-tight drop-shadow-sm">
          {song.deezer_artist.length > 12 
            ? song.deezer_artist.substring(0, 12) + '...' 
            : song.deezer_artist}
        </div>
        
        {/* Release Year */}
        <div className="text-lg font-black text-center drop-shadow-md">
          {song.release_year}
        </div>
        
        {/* Song Title */}
        <div className="text-xs italic text-center w-full leading-tight text-white/95 drop-shadow-sm">
          {song.deezer_title.length > 14 
            ? song.deezer_title.substring(0, 14) + '...' 
            : song.deezer_title}
        </div>

        {/* Hover shimmer overlay */}
        {isHovered && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer rounded-lg pointer-events-none" />
        )}

        {/* Selection glow */}
        {isSelected && (
          <div className="absolute inset-0 bg-blue-400/10 rounded-lg animate-pulse pointer-events-none" />
        )}
      </div>

      {/* Success Particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-ping pointer-events-none"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${particle.id * 0.1}s`,
            animationDuration: '1s'
          }}
        />
      ))}

      {/* Magnetic field effect when highlighted */}
      {isHighlighted && (
        <div className="absolute -inset-2 border border-green-400/30 rounded-lg animate-pulse pointer-events-none" />
      )}
    </div>
  );
}