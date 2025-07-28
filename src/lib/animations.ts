/**
 * Rythmy - Centralized Animation System
 * Manages all animations, transitions, and visual effects
 */

import { Song } from '@/types/game';

export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
}

export const ANIMATION_PRESETS = {
  // Enhanced duration presets (in milliseconds) for more grandiose feel
  INSTANT: 0,
  FAST: 250,
  NORMAL: 400,
  SLOW: 650,
  VERY_SLOW: 1000,
  GRANDIOSE: 1500,
  EPIC: 2000,

  // Enhanced easing presets for smoother, more sophisticated animations
  EASE_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
  EASE_IN: 'cubic-bezier(0.4, 0, 1, 1)',
  EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
  BOUNCE: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  ELASTIC: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  // New sophisticated easing functions for grandiose animations
  SMOOTH_BOUNCE: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  GENTLE_SPRING: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  DRAMATIC_EASE: 'cubic-bezier(0.25, 0, 0.25, 1)',
  SILK_SMOOTH: 'cubic-bezier(0.23, 1, 0.32, 1)',
  ANTICIPATION: 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
};

export const ANIMATIONS = {
  // Enhanced card animations with grandiose effects
  CARD_ENTRANCE: {
    duration: ANIMATION_PRESETS.SLOW,
    easing: ANIMATION_PRESETS.SMOOTH_BOUNCE,
    keyframes: [
      { opacity: 0, transform: 'translateY(40px) scale(0.8) rotateX(-15deg)', filter: 'blur(3px) brightness(0.7)' },
      { opacity: 0.7, transform: 'translateY(10px) scale(1.05) rotateX(-5deg)', filter: 'blur(1px) brightness(1.1)' },
      { opacity: 1, transform: 'translateY(0) scale(1) rotateX(0deg)', filter: 'blur(0px) brightness(1)' }
    ] as Keyframe[]
  },

  CARD_EXIT: {
    duration: ANIMATION_PRESETS.SLOW,
    easing: ANIMATION_PRESETS.ANTICIPATION,
    keyframes: [
      { opacity: 1, transform: 'translateY(0) scale(1) rotateX(0deg)', filter: 'blur(0px) brightness(1)' },
      { opacity: 0.7, transform: 'translateY(-10px) scale(1.05) rotateX(5deg)', filter: 'blur(1px) brightness(1.2)' },
      { opacity: 0, transform: 'translateY(-40px) scale(0.8) rotateX(15deg)', filter: 'blur(3px) brightness(0.7)' }
    ] as Keyframe[]
  },

  CARD_THROW: {
    duration: ANIMATION_PRESETS.GRANDIOSE,
    easing: ANIMATION_PRESETS.DRAMATIC_EASE,
    keyframes: [
      { transform: 'scale(1) rotate(0deg) translateZ(0px)', opacity: 1, filter: 'brightness(1) saturate(1)' },
      { transform: 'scale(1.1) rotate(90deg) translateZ(20px)', opacity: 0.9, filter: 'brightness(1.2) saturate(1.3)' },
      { transform: 'scale(0.9) rotate(270deg) translateZ(10px)', opacity: 0.8, filter: 'brightness(1.4) saturate(1.5)' },
      { transform: 'scale(1) rotate(360deg) translateZ(0px)', opacity: 1, filter: 'brightness(1) saturate(1)' }
    ] as Keyframe[]
  },

  CARD_PLACEMENT: {
    duration: ANIMATION_PRESETS.SLOW,
    easing: ANIMATION_PRESETS.SMOOTH_BOUNCE,
    keyframes: [
      { transform: 'scale(0.7) translateY(-30px) rotateY(-20deg)', opacity: 0, filter: 'blur(2px) brightness(0.8)' },
      { transform: 'scale(1.15) translateY(8px) rotateY(5deg)', opacity: 0.8, filter: 'blur(0.5px) brightness(1.3)' },
      { transform: 'scale(0.95) translateY(-2px) rotateY(-2deg)', opacity: 0.95, filter: 'blur(0px) brightness(1.1)' },
      { transform: 'scale(1) translateY(0) rotateY(0deg)', opacity: 1, filter: 'blur(0px) brightness(1)' }
    ] as Keyframe[]
  },

  // Player animations
  PLAYER_SWAP_ENTER: {
    duration: ANIMATION_PRESETS.SLOW,
    easing: ANIMATION_PRESETS.EASE_OUT,
    keyframes: [
      { transform: 'translateX(-100%) scale(0.9)', opacity: 0 },
      { transform: 'translateX(10px) scale(1.05)', opacity: 0.8 },
      { transform: 'translateX(0) scale(1)', opacity: 1 }
    ] as Keyframe[]
  },

  PLAYER_SWAP_EXIT: {
    duration: ANIMATION_PRESETS.NORMAL,
    easing: ANIMATION_PRESETS.EASE_IN,
    keyframes: [
      { transform: 'translateX(0) scale(1)', opacity: 1 },
      { transform: 'translateX(100%) scale(0.9)', opacity: 0 }
    ] as Keyframe[]
  },

  PLAYER_HIGHLIGHT: {
    duration: ANIMATION_PRESETS.SLOW,
    easing: ANIMATION_PRESETS.EASE_IN_OUT,
    keyframes: [
      { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(139, 92, 246, 0.7)' },
      { transform: 'scale(1.05)', boxShadow: '0 0 0 20px rgba(139, 92, 246, 0)' },
      { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(139, 92, 246, 0)' }
    ] as Keyframe[]
  },

  // Timeline animations
  TIMELINE_SLIDE_LEFT: {
    duration: ANIMATION_PRESETS.SLOW,
    easing: ANIMATION_PRESETS.EASE_IN_OUT,
    keyframes: [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-20px)' },
      { transform: 'translateX(0)' }
    ] as Keyframe[]
  },

  TIMELINE_SLIDE_RIGHT: {
    duration: ANIMATION_PRESETS.SLOW,
    easing: ANIMATION_PRESETS.EASE_IN_OUT,
    keyframes: [
      { transform: 'translateX(0)' },
      { transform: 'translateX(20px)' },
      { transform: 'translateX(0)' }
    ] as Keyframe[]
  },

  // Feedback animations
  SUCCESS_PULSE: {
    duration: ANIMATION_PRESETS.SLOW,
    easing: ANIMATION_PRESETS.EASE_OUT,
    keyframes: [
      { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(34, 197, 94, 0.7)' },
      { transform: 'scale(1.1)', boxShadow: '0 0 0 20px rgba(34, 197, 94, 0)' },
      { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(34, 197, 94, 0)' }
    ] as Keyframe[]
  },

  ERROR_SHAKE: {
    duration: ANIMATION_PRESETS.SLOW,
    easing: ANIMATION_PRESETS.EASE_IN_OUT,
    keyframes: [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-8px)' },
      { transform: 'translateX(8px)' },
      { transform: 'translateX(-8px)' },
      { transform: 'translateX(8px)' },
      { transform: 'translateX(0)' }
    ] as Keyframe[]
  },

  // Phase transition animations
  FADE_IN_UP: {
    duration: ANIMATION_PRESETS.NORMAL,
    easing: ANIMATION_PRESETS.EASE_OUT,
    keyframes: [
      { transform: 'translateY(30px)', opacity: 0 },
      { transform: 'translateY(0)', opacity: 1 }
    ] as Keyframe[]
  },

  FADE_OUT_DOWN: {
    duration: ANIMATION_PRESETS.FAST,
    easing: ANIMATION_PRESETS.EASE_IN,
    keyframes: [
      { transform: 'translateY(0)', opacity: 1 },
      { transform: 'translateY(30px)', opacity: 0 }
    ] as Keyframe[]
  },

  // Special effects
  GLOW_PULSE: {
    duration: 2000,
    easing: ANIMATION_PRESETS.EASE_IN_OUT,
    keyframes: [
      { boxShadow: '0 0 10px rgba(139, 92, 246, 0.3)' },
      { boxShadow: '0 0 25px rgba(139, 92, 246, 0.5)' },
      { boxShadow: '0 0 10px rgba(139, 92, 246, 0.3)' }
    ] as Keyframe[]
  },

  BOUNCE_IN: {
    duration: ANIMATION_PRESETS.SLOW,
    easing: ANIMATION_PRESETS.BOUNCE,
    keyframes: [
      { transform: 'scale(0.3)', opacity: 0 },
      { transform: 'scale(1.05)', opacity: 0.9 },
      { transform: 'scale(0.9)', opacity: 1 },
      { transform: 'scale(1)', opacity: 1 }
    ] as Keyframe[]
  },

  // Enhanced card placement animations for immersive gameplay
  CARDS_BUNCH_UP: {
    duration: ANIMATION_PRESETS.GRANDIOSE,
    easing: ANIMATION_PRESETS.GENTLE_SPRING,
    keyframes: [
      { 
        transform: 'translateX(0) scale(1) rotateY(0deg) rotateZ(0deg)', 
        opacity: 1, 
        filter: 'blur(0px) brightness(1) saturate(1) drop-shadow(0 4px 8px rgba(0,0,0,0.1))' 
      },
      { 
        transform: 'translateX(-15%) scale(0.95) rotateY(-8deg) rotateZ(-2deg)', 
        opacity: 0.95, 
        filter: 'blur(0.5px) brightness(1.1) saturate(1.2) drop-shadow(0 6px 12px rgba(0,0,0,0.15))' 
      },
      { 
        transform: 'translateX(-45%) scale(0.8) rotateY(-18deg) rotateZ(-5deg)', 
        opacity: 0.88, 
        filter: 'blur(1.5px) brightness(1.25) saturate(1.4) drop-shadow(0 8px 16px rgba(0,0,0,0.2))' 
      },
      { 
        transform: 'translateX(-75%) scale(0.65) rotateY(-28deg) rotateZ(-8deg)', 
        opacity: 0.8, 
        filter: 'blur(2.5px) brightness(1.4) saturate(1.6) drop-shadow(0 10px 20px rgba(0,0,0,0.25))' 
      },
      { 
        transform: 'translateX(-100%) scale(0.5) rotateY(-35deg) rotateZ(-10deg)', 
        opacity: 0.7, 
        filter: 'blur(3px) brightness(1.5) saturate(1.8) drop-shadow(0 12px 24px rgba(0,0,0,0.3))' 
      }
    ] as Keyframe[]
  },

  CARDS_SPREAD_OUT: {
    duration: ANIMATION_PRESETS.GRANDIOSE,
    easing: ANIMATION_PRESETS.SILK_SMOOTH,
    keyframes: [
      { 
        transform: 'translateX(-100%) scale(0.5) rotateY(-35deg) rotateZ(-10deg)', 
        opacity: 0.7, 
        filter: 'blur(3px) brightness(1.5) saturate(1.8) drop-shadow(0 12px 24px rgba(0,0,0,0.3))' 
      },
      { 
        transform: 'translateX(-75%) scale(0.65) rotateY(-28deg) rotateZ(-8deg)', 
        opacity: 0.8, 
        filter: 'blur(2.5px) brightness(1.4) saturate(1.6) drop-shadow(0 10px 20px rgba(0,0,0,0.25))' 
      },
      { 
        transform: 'translateX(-45%) scale(0.8) rotateY(-18deg) rotateZ(-5deg)', 
        opacity: 0.88, 
        filter: 'blur(1.5px) brightness(1.25) saturate(1.4) drop-shadow(0 8px 16px rgba(0,0,0,0.2))' 
      },
      { 
        transform: 'translateX(-15%) scale(0.95) rotateY(-8deg) rotateZ(-2deg)', 
        opacity: 0.95, 
        filter: 'blur(0.5px) brightness(1.1) saturate(1.2) drop-shadow(0 6px 12px rgba(0,0,0,0.15))' 
      },
      { 
        transform: 'translateX(0) scale(1) rotateY(0deg) rotateZ(0deg)', 
        opacity: 1, 
        filter: 'blur(0px) brightness(1) saturate(1) drop-shadow(0 4px 8px rgba(0,0,0,0.1))' 
      }
    ] as Keyframe[]
  },

  CASSETTE_TO_TIMELINE: {
    duration: ANIMATION_PRESETS.VERY_SLOW,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    keyframes: [
      { transform: 'translateY(0) scale(1) rotateX(0deg)', opacity: 1, filter: 'brightness(1)' },
      { transform: 'translateY(-15vh) scale(1.05) rotateX(5deg)', opacity: 0.95, filter: 'brightness(1.1)' },
      { transform: 'translateY(-35vh) scale(1.1) rotateX(10deg)', opacity: 0.9, filter: 'brightness(1.2)' },
      { transform: 'translateY(-50vh) scale(0.95) rotateX(0deg)', opacity: 1, filter: 'brightness(1)' }
    ] as Keyframe[]
  },

  TIMELINE_TO_CASSETTE: {
    duration: ANIMATION_PRESETS.VERY_SLOW,
    easing: 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
    keyframes: [
      { transform: 'translateY(-50vh) scale(0.95) rotateX(0deg)', opacity: 1, filter: 'brightness(1)' },
      { transform: 'translateY(-35vh) scale(1.1) rotateX(-10deg)', opacity: 0.9, filter: 'brightness(1.2)' },
      { transform: 'translateY(-15vh) scale(1.05) rotateX(-5deg)', opacity: 0.95, filter: 'brightness(1.1)' },
      { transform: 'translateY(0) scale(1) rotateX(0deg)', opacity: 1, filter: 'brightness(1)' }
    ] as Keyframe[]
  },

  CARD_FALL_CORRECT: {
    duration: ANIMATION_PRESETS.EPIC,
    easing: ANIMATION_PRESETS.GENTLE_SPRING,
    keyframes: [
      { 
        transform: 'translateY(-120vh) rotate(0deg) scale(1) rotateX(0deg)', 
        opacity: 1, 
        filter: 'drop-shadow(0 0 15px rgba(34, 197, 94, 0.6)) blur(0px) brightness(1)' 
      },
      { 
        transform: 'translateY(-90vh) rotate(20deg) scale(1.15) rotateX(10deg)', 
        opacity: 0.95, 
        filter: 'drop-shadow(0 0 25px rgba(34, 197, 94, 0.8)) blur(0.5px) brightness(1.2)' 
      },
      { 
        transform: 'translateY(-60vh) rotate(-10deg) scale(1.25) rotateX(-5deg)', 
        opacity: 0.9, 
        filter: 'drop-shadow(0 0 35px rgba(34, 197, 94, 0.9)) blur(1px) brightness(1.4)' 
      },
      { 
        transform: 'translateY(-30vh) rotate(5deg) scale(1.1) rotateX(5deg)', 
        opacity: 0.95, 
        filter: 'drop-shadow(0 0 45px rgba(34, 197, 94, 1)) blur(0.5px) brightness(1.3)' 
      },
      { 
        transform: 'translateY(-5vh) rotate(-2deg) scale(1.02) rotateX(-2deg)', 
        opacity: 1, 
        filter: 'drop-shadow(0 0 35px rgba(34, 197, 94, 0.8)) blur(0px) brightness(1.1)' 
      },
      { 
        transform: 'translateY(0) rotate(0deg) scale(1) rotateX(0deg)', 
        opacity: 1, 
        filter: 'drop-shadow(0 0 0px rgba(34, 197, 94, 0)) blur(0px) brightness(1)' 
      }
    ] as Keyframe[]
  },

  CARD_FALL_INCORRECT: {
    duration: ANIMATION_PRESETS.EPIC * 1.2,
    easing: ANIMATION_PRESETS.ANTICIPATION,
    keyframes: [
      { 
        transform: 'translateY(-120vh) rotate(0deg) scale(1) rotateX(0deg)', 
        opacity: 1, 
        filter: 'drop-shadow(0 0 15px rgba(239, 68, 68, 0.6)) blur(0px) brightness(1)' 
      },
      { 
        transform: 'translateY(-80vh) rotate(180deg) scale(1.2) rotateX(15deg)', 
        opacity: 0.85, 
        filter: 'drop-shadow(0 0 25px rgba(239, 68, 68, 0.8)) blur(1px) brightness(1.2)' 
      },
      { 
        transform: 'translateY(-40vh) rotate(360deg) scale(1.05) rotateX(-10deg)', 
        opacity: 0.7, 
        filter: 'drop-shadow(0 0 35px rgba(239, 68, 68, 0.9)) blur(2px) brightness(1.4)' 
      },
      { 
        transform: 'translateY(20vh) rotate(540deg) scale(0.9) rotateX(20deg)', 
        opacity: 0.5, 
        filter: 'drop-shadow(0 0 25px rgba(239, 68, 68, 0.7)) blur(3px) brightness(1.1)' 
      },
      { 
        transform: 'translateY(80vh) rotate(720deg) scale(0.7) rotateX(30deg)', 
        opacity: 0.2, 
        filter: 'drop-shadow(0 0 15px rgba(239, 68, 68, 0.5)) blur(4px) brightness(0.8)' 
      },
      { 
        transform: 'translateY(150vh) rotate(900deg) scale(0.4) rotateX(45deg)', 
        opacity: 0, 
        filter: 'drop-shadow(0 0 0px rgba(239, 68, 68, 0)) blur(5px) brightness(0.5)' 
      }
    ] as Keyframe[]
  },

  CARDS_MAKE_ROOM: {
    duration: ANIMATION_PRESETS.NORMAL,
    easing: ANIMATION_PRESETS.EASE_OUT,
    keyframes: [
      { transform: 'translateX(0) scale(1)', opacity: 1, filter: 'brightness(1)' },
      { transform: 'translateX(15px) scale(0.97)', opacity: 0.95, filter: 'brightness(0.9)' },
      { transform: 'translateX(35px) scale(0.95)', opacity: 0.9, filter: 'brightness(0.8)' },
      { transform: 'translateX(50px) scale(1)', opacity: 1, filter: 'brightness(1)' }
    ] as Keyframe[]
  },

  CARD_THUMP_LAND: {
    duration: 600,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    keyframes: [
      { transform: 'translateY(-8px) scale(1.08)', opacity: 0.9, filter: 'drop-shadow(0 8px 15px rgba(0, 0, 0, 0.3))' },
      { transform: 'translateY(5px) scale(0.92)', opacity: 1, filter: 'drop-shadow(0 2px 5px rgba(0, 0, 0, 0.2))' },
      { transform: 'translateY(-2px) scale(1.03)', opacity: 1, filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15))' },
      { transform: 'translateY(1px) scale(0.98)', opacity: 1, filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.1))' },
      { transform: 'translateY(0) scale(1)', opacity: 1, filter: 'drop-shadow(0 0 0px rgba(0, 0, 0, 0))' }
    ] as Keyframe[]
  },

  HOST_FEEDBACK_CORRECT: {
    duration: 1200,
    easing: ANIMATION_PRESETS.EASE_OUT,
    keyframes: [
      { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(34, 197, 94, 0.8)', backgroundColor: 'transparent', filter: 'brightness(1)' },
      { transform: 'scale(1.03)', boxShadow: '0 0 0 15px rgba(34, 197, 94, 0.4)', backgroundColor: 'rgba(34, 197, 94, 0.15)', filter: 'brightness(1.1)' },
      { transform: 'scale(1.06)', boxShadow: '0 0 0 25px rgba(34, 197, 94, 0.2)', backgroundColor: 'rgba(34, 197, 94, 0.1)', filter: 'brightness(1.2)' },
      { transform: 'scale(1)', boxShadow: '0 0 0 40px rgba(34, 197, 94, 0)', backgroundColor: 'transparent', filter: 'brightness(1)' }
    ] as Keyframe[]
  },

  HOST_FEEDBACK_INCORRECT: {
    duration: 1200,
    easing: ANIMATION_PRESETS.EASE_IN_OUT,
    keyframes: [
      { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.8)', backgroundColor: 'transparent', filter: 'brightness(1)' },
      { transform: 'scale(0.97)', boxShadow: '0 0 0 15px rgba(239, 68, 68, 0.4)', backgroundColor: 'rgba(239, 68, 68, 0.15)', filter: 'brightness(0.9)' },
      { transform: 'scale(0.94)', boxShadow: '0 0 0 25px rgba(239, 68, 68, 0.2)', backgroundColor: 'rgba(239, 68, 68, 0.1)', filter: 'brightness(0.8)' },
      { transform: 'scale(1)', boxShadow: '0 0 0 40px rgba(239, 68, 68, 0)', backgroundColor: 'transparent', filter: 'brightness(1)' }
    ] as Keyframe[]
  },

  // Enhanced mobile-specific animations for timeline interaction
  MOBILE_CARD_SELECT: {
    duration: ANIMATION_PRESETS.NORMAL,
    easing: ANIMATION_PRESETS.SILK_SMOOTH,
    keyframes: [
      { transform: 'scale(1) translateY(0)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', filter: 'brightness(1)' },
      { transform: 'scale(1.08) translateY(-4px)', boxShadow: '0 12px 24px rgba(0, 0, 0, 0.25)', filter: 'brightness(1.15)' },
      { transform: 'scale(1.05) translateY(-2px)', boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)', filter: 'brightness(1.1)' }
    ] as Keyframe[]
  },

  MOBILE_CARD_DESELECT: {
    duration: ANIMATION_PRESETS.NORMAL,
    easing: ANIMATION_PRESETS.SILK_SMOOTH,
    keyframes: [
      { transform: 'scale(1.05) translateY(-2px)', boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)', filter: 'brightness(1.1)' },
      { transform: 'scale(1) translateY(0)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', filter: 'brightness(1)' }
    ] as Keyframe[]
  },

  MOBILE_GAP_HIGHLIGHT: {
    duration: ANIMATION_PRESETS.SLOW,
    easing: ANIMATION_PRESETS.GENTLE_SPRING,
    keyframes: [
      { 
        backgroundColor: 'rgba(34, 197, 94, 0.2)', 
        boxShadow: '0 0 0 2px rgba(34, 197, 94, 0.4)', 
        transform: 'scale(1)',
        filter: 'brightness(1)'
      },
      { 
        backgroundColor: 'rgba(34, 197, 94, 0.4)', 
        boxShadow: '0 0 0 4px rgba(34, 197, 94, 0.6), 0 0 20px rgba(34, 197, 94, 0.3)', 
        transform: 'scale(1.1)',
        filter: 'brightness(1.2)'
      },
      { 
        backgroundColor: 'rgba(34, 197, 94, 0.3)', 
        boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.5), 0 0 15px rgba(34, 197, 94, 0.2)', 
        transform: 'scale(1.05)',
        filter: 'brightness(1.1)'
      }
    ] as Keyframe[]
  },

  MOBILE_TIMELINE_SCROLL: {
    duration: ANIMATION_PRESETS.SLOW,
    easing: ANIMATION_PRESETS.SILK_SMOOTH,
    keyframes: [
      { transform: 'translateX(0)', opacity: 1, filter: 'blur(0px)' },
      { transform: 'translateX(-2px)', opacity: 0.98, filter: 'blur(0.2px)' },
      { transform: 'translateX(2px)', opacity: 0.98, filter: 'blur(0.2px)' },
      { transform: 'translateX(0)', opacity: 1, filter: 'blur(0px)' }
    ] as Keyframe[]
  },
};

// Animation utility functions
export class AnimationManager {
  private static instance: AnimationManager;
  private activeAnimations = new Map<string, Animation>();

  static getInstance(): AnimationManager {
    if (!AnimationManager.instance) {
      AnimationManager.instance = new AnimationManager();
    }
    return AnimationManager.instance;
  }

  async animate(
    element: HTMLElement,
    animationKey: keyof typeof ANIMATIONS,
    options?: Partial<AnimationConfig>
  ): Promise<void> {
    const animation = ANIMATIONS[animationKey];
    const config = {
      duration: animation.duration,
      easing: animation.easing,
      ...options
    };

    return new Promise((resolve) => {
      const webAnimation = element.animate(animation.keyframes, {
        duration: config.duration,
        easing: config.easing,
        delay: config.delay || 0,
        fill: 'forwards'
      });

      const animationId = `${element.id || 'element'}-${Date.now()}`;
      this.activeAnimations.set(animationId, webAnimation);

      webAnimation.addEventListener('finish', () => {
        this.activeAnimations.delete(animationId);
        resolve();
      });
    });
  }

  stopAnimation(animationId: string): void {
    const animation = this.activeAnimations.get(animationId);
    if (animation) {
      animation.cancel();
      this.activeAnimations.delete(animationId);
    }
  }

  // Enhanced animation methods for turn management
  async animateCardFallCorrect(config: {
    song: Song;
    position: number;
    duration?: number;
    onProgress?: (progress: number) => void;
  }): Promise<void> {
    console.log('🎬 ANIMATION: Card fall correct animation starting');
    
    // Create temporary card element for animation
    const tempCard = this.createTempCardElement(config.song);
    document.body.appendChild(tempCard);
    
    try {
      await this.animate(tempCard, 'CARD_FALL_CORRECT', {
        duration: (config.duration || 2.0) * 1000, // Convert to milliseconds
        ...((config.onProgress && {
          onUpdate: () => {
            // Progress callback implementation would need access to animation progress
            config.onProgress?.(0.5); // Simplified for now
          }
        }) || {})
      });
    } finally {
      document.body.removeChild(tempCard);
    }
  }

  async animateCardFallIncorrect(config: {
    song: Song;
    position: number;
    duration?: number;
    onProgress?: (progress: number) => void;
  }): Promise<void> {
    console.log('🎬 ANIMATION: Card fall incorrect animation starting');
    
    const tempCard = this.createTempCardElement(config.song);
    document.body.appendChild(tempCard);
    
    try {
      await this.animate(tempCard, 'CARD_FALL_INCORRECT', {
        duration: (config.duration || 2.4) * 1000,
        ...((config.onProgress && {
          onUpdate: () => {
            config.onProgress?.(0.5);
          }
        }) || {})
      });
    } finally {
      document.body.removeChild(tempCard);
    }
  }

  async animateCorrectPlacement(playerId: string): Promise<void> {
    console.log('🎬 ANIMATION: Correct placement feedback for', playerId);
    const playerElement = document.querySelector(`[data-player-id="${playerId}"]`) as HTMLElement;
    if (playerElement) {
      await this.animate(playerElement, 'SUCCESS_PULSE');
    }
  }

  async animateIncorrectPlacement(playerId: string): Promise<void> {
    console.log('🎬 ANIMATION: Incorrect placement feedback for', playerId);
    const playerElement = document.querySelector(`[data-player-id="${playerId}"]`) as HTMLElement;
    if (playerElement) {
      await this.animate(playerElement, 'ERROR_SHAKE');
    }
  }

  async animateCardsBunchUp(timelineLength: number): Promise<void> {
    console.log('🎬 ANIMATION: Cards bunch up animation');
    const cardElements = document.querySelectorAll('.timeline-card');
    
    const animations = Array.from(cardElements).map((element, index) => 
      this.animate(element as HTMLElement, 'CARDS_BUNCH_UP', {
        delay: index * 100 // Stagger the animation
      })
    );
    
    await Promise.all(animations);
  }

  async animateCardsSpreadOut(timelineLength: number): Promise<void> {
    console.log('🎬 ANIMATION: Cards spread out animation');
    const cardElements = document.querySelectorAll('.timeline-card');
    
    const animations = Array.from(cardElements).map((element, index) => 
      this.animate(element as HTMLElement, 'CARDS_SPREAD_OUT', {
        delay: index * 100
      })
    );
    
    await Promise.all(animations);
  }

  async animatePlayerHighlight(playerId: string): Promise<void> {
    console.log('🎬 ANIMATION: Player highlight for', playerId);
    const playerElement = document.querySelector(`[data-player-id="${playerId}"]`) as HTMLElement;
    if (playerElement) {
      await this.animate(playerElement, 'PLAYER_HIGHLIGHT');
    }
  }

  async animateMysteryCardReveal(config: {
    song: Song;
    duration?: number;
  }): Promise<void> {
    console.log('🎬 ANIMATION: Mystery card reveal animation');
    const mysteryCardElement = document.querySelector('.mystery-card') as HTMLElement;
    if (mysteryCardElement) {
      await this.animate(mysteryCardElement, 'BOUNCE_IN', {
        duration: (config.duration || 1.5) * 1000
      });
    }
  }

  // Helper method to create temporary card elements for animations
  private createTempCardElement(song: Song): HTMLElement {
    const cardElement = document.createElement('div');
    cardElement.className = 'absolute w-28 h-36 rounded-xl border-2 flex flex-col items-center justify-between p-3 text-white shadow-2xl transform-gpu';
    cardElement.style.cssText = `
      left: 50%;
      top: -120vh;
      transform: translateX(-50%);
      background: linear-gradient(135deg, hsl(220, 70%, 25%), hsl(220, 70%, 35%));
      border-color: rgba(34, 197, 94, 0.6);
      z-index: 9999;
      pointer-events: none;
    `;
    
    cardElement.innerHTML = `
      <div class="text-xs font-bold text-center w-full leading-tight drop-shadow-sm">
        ${song.deezer_artist.length > 14 ? song.deezer_artist.substring(0, 14) + '...' : song.deezer_artist}
      </div>
      <div class="text-2xl font-black text-center drop-shadow-md">
        ${song.release_year}
      </div>
      <div class="text-xs italic text-center w-full leading-tight text-white/95 drop-shadow-sm">
        ${song.deezer_title.length > 16 ? song.deezer_title.substring(0, 16) + '...' : song.deezer_title}
      </div>
    `;
    
    return cardElement;
  }

  stopAllAnimations(): void {
    this.activeAnimations.forEach(animation => animation.cancel());
    this.activeAnimations.clear();
  }

  // CSS class-based animations for React components
  getCSSAnimationClass(animationKey: keyof typeof ANIMATIONS): string {
    return `timeliner-${animationKey.toLowerCase().replace(/_/g, '-')}`;
  }
}

// React hook for animations
export const useAnimation = () => {
  const animationManager = AnimationManager.getInstance();

  const animateElement = async (
    elementRef: React.RefObject<HTMLElement>,
    animationKey: keyof typeof ANIMATIONS,
    options?: Partial<AnimationConfig>
  ) => {
    if (elementRef.current) {
      await animationManager.animate(elementRef.current, animationKey, options);
    }
  };

  return {
    animateElement,
    stopAllAnimations: () => animationManager.stopAllAnimations(),
    getCSSClass: (animationKey: keyof typeof ANIMATIONS) => 
      animationManager.getCSSAnimationClass(animationKey)
  };
};

export default AnimationManager;
