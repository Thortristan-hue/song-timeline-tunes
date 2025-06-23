
// Timeliner - Animation Utilities
// This file now uses the centralized animation system

import { ANIMATIONS, AnimationManager } from '@/lib/animations';

export const cardAnimations = {
  // Duration in milliseconds - now using centralized values
  throwDuration: ANIMATIONS.CARD_THROW.duration,
  placementDuration: ANIMATIONS.CARD_PLACEMENT.duration,
  
  // CSS classes for animations - now using centralized system
  throw: 'timeliner-card-throw',
  placement: 'timeliner-card-placement',
  success: 'timeliner-success-pulse',
  error: 'timeliner-error-shake'
};

export const calculateThrowPath = (
  startX: number,
  startY: number,
  endX: number,
  endY: number
) => {
  // Calculate control point for curved trajectory
  const controlX = (startX + endX) / 2;
  const controlY = Math.min(startY, endY) - 100;

  return `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;
};

// Re-export the animation manager for backwards compatibility
export { AnimationManager, ANIMATIONS };
