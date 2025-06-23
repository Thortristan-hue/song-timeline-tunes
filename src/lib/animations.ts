/**
 * Timeliner - Centralized Animation System
 * Manages all animations, transitions, and visual effects
 */

export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
}

export const ANIMATION_PRESETS = {
  // Duration presets (in milliseconds)
  INSTANT: 0,
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
  VERY_SLOW: 800,

  // Easing presets
  EASE_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
  EASE_IN: 'cubic-bezier(0.4, 0, 1, 1)',
  EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
  BOUNCE: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  ELASTIC: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
};

export const ANIMATIONS = {
  // Card animations
  CARD_ENTRANCE: {
    duration: ANIMATION_PRESETS.NORMAL,
    easing: ANIMATION_PRESETS.EASE_OUT,
    keyframes: [
      { opacity: 0, transform: 'translateY(20px) scale(0.95)' },
      { opacity: 1, transform: 'translateY(0) scale(1)' }
    ] as Keyframe[]
  },

  CARD_EXIT: {
    duration: ANIMATION_PRESETS.FAST,
    easing: ANIMATION_PRESETS.EASE_IN,
    keyframes: [
      { opacity: 1, transform: 'translateY(0) scale(1)' },
      { opacity: 0, transform: 'translateY(-20px) scale(0.95)' }
    ] as Keyframe[]
  },

  CARD_THROW: {
    duration: ANIMATION_PRESETS.SLOW,
    easing: ANIMATION_PRESETS.EASE_OUT,
    keyframes: [
      { transform: 'scale(1) rotate(0deg)', opacity: 1 },
      { transform: 'scale(0.8) rotate(180deg)', opacity: 0.8 },
      { transform: 'scale(1) rotate(360deg)', opacity: 1 }
    ] as Keyframe[]
  },

  CARD_PLACEMENT: {
    duration: ANIMATION_PRESETS.NORMAL,
    easing: ANIMATION_PRESETS.BOUNCE,
    keyframes: [
      { transform: 'scale(0.8) translateY(-20px)', opacity: 0 },
      { transform: 'scale(1.1) translateY(5px)', opacity: 0.9 },
      { transform: 'scale(1) translateY(0)', opacity: 1 }
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
  }
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
