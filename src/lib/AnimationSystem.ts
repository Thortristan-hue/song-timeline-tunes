/**
 * Consolidated Animation System for Song Timeline Tunes
 * Centralizes all animations, transitions, and visual effects
 */

export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
  fillMode?: 'forwards' | 'backwards' | 'both' | 'none';
}

export const ANIMATION_DURATION = {
  INSTANT: 0,
  FAST: 250,
  NORMAL: 400,
  SLOW: 650,
  VERY_SLOW: 1000,
  GRANDIOSE: 1500,
  EPIC: 2000,
} as const;

export const ANIMATION_EASING = {
  EASE_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
  EASE_IN: 'cubic-bezier(0.4, 0, 1, 1)',
  EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
  BOUNCE: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  ELASTIC: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  SMOOTH_BOUNCE: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  GENTLE_SPRING: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  DRAMATIC_EASE: 'cubic-bezier(0.25, 0, 0.25, 1)',
  SILK_SMOOTH: 'cubic-bezier(0.23, 1, 0.32, 1)',
  ANTICIPATION: 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
} as const;

// Enhanced Animation Definitions
export const ANIMATIONS = {
  // Card Shimmer Effect
  CARD_SHIMMER: {
    duration: ANIMATION_DURATION.SLOW,
    easing: ANIMATION_EASING.EASE_IN_OUT,
    keyframes: [
      { 
        backgroundPosition: '-200px 0',
        filter: 'brightness(1) saturate(1)'
      },
      { 
        backgroundPosition: '200px 0',
        filter: 'brightness(1.2) saturate(1.3)'
      }
    ] as Keyframe[]
  },

  // Staggered Card Entrance
  CARD_STAGGER_ENTRANCE: {
    duration: ANIMATION_DURATION.NORMAL,
    easing: ANIMATION_EASING.SMOOTH_BOUNCE,
    keyframes: [
      { 
        opacity: 0, 
        transform: 'translateY(30px) scale(0.9)', 
        filter: 'blur(2px)' 
      },
      { 
        opacity: 0.7, 
        transform: 'translateY(10px) scale(1.05)', 
        filter: 'blur(1px)' 
      },
      { 
        opacity: 1, 
        transform: 'translateY(0) scale(1)', 
        filter: 'blur(0px)' 
      }
    ] as Keyframe[]
  },

  // Magnetic Snap Effect
  MAGNETIC_SNAP: {
    duration: ANIMATION_DURATION.FAST,
    easing: ANIMATION_EASING.ELASTIC,
    keyframes: [
      { transform: 'scale(1) translateX(0)', filter: 'brightness(1)' },
      { transform: 'scale(1.05) translateX(-5px)', filter: 'brightness(1.1)' },
      { transform: 'scale(0.98) translateX(2px)', filter: 'brightness(1.05)' },
      { transform: 'scale(1) translateX(0)', filter: 'brightness(1)' }
    ] as Keyframe[]
  },

  // Success Particles
  SUCCESS_PARTICLES: {
    duration: ANIMATION_DURATION.GRANDIOSE,
    easing: ANIMATION_EASING.EASE_OUT,
    keyframes: [
      { 
        opacity: 0, 
        transform: 'scale(0) rotate(0deg)', 
        filter: 'brightness(2) saturate(2)' 
      },
      { 
        opacity: 1, 
        transform: 'scale(1.2) rotate(180deg)', 
        filter: 'brightness(1.5) saturate(1.5)' 
      },
      { 
        opacity: 0.8, 
        transform: 'scale(0.8) rotate(360deg)', 
        filter: 'brightness(1) saturate(1)' 
      },
      { 
        opacity: 0, 
        transform: 'scale(0) rotate(540deg)', 
        filter: 'brightness(0.5) saturate(0.5)' 
      }
    ] as Keyframe[]
  },

  // Audio Reactive Pulse
  AUDIO_REACTIVE_PULSE: {
    duration: ANIMATION_DURATION.NORMAL,
    easing: ANIMATION_EASING.EASE_IN_OUT,
    keyframes: [
      { 
        transform: 'scale(1)', 
        boxShadow: '0 0 0 0 rgba(59, 130, 246, 0.7)',
        filter: 'brightness(1) saturate(1) hue-rotate(0deg)'
      },
      { 
        transform: 'scale(1.08)', 
        boxShadow: '0 0 0 15px rgba(59, 130, 246, 0.3)',
        filter: 'brightness(1.2) saturate(1.3) hue-rotate(30deg)'
      },
      { 
        transform: 'scale(1)', 
        boxShadow: '0 0 0 30px rgba(59, 130, 246, 0)',
        filter: 'brightness(1) saturate(1) hue-rotate(0deg)'
      }
    ] as Keyframe[]
  },

  // Parallax Float
  PARALLAX_FLOAT: {
    duration: ANIMATION_DURATION.EPIC,
    easing: ANIMATION_EASING.EASE_IN_OUT,
    keyframes: [
      { transform: 'translateY(0px) translateX(0px) rotate(0deg)', opacity: 0.4 },
      { transform: 'translateY(-20px) translateX(10px) rotate(5deg)', opacity: 0.8 },
      { transform: 'translateY(-40px) translateX(-5px) rotate(-5deg)', opacity: 1 },
      { transform: 'translateY(-20px) translateX(10px) rotate(3deg)', opacity: 0.8 },
      { transform: 'translateY(0px) translateX(0px) rotate(0deg)', opacity: 0.4 }
    ] as Keyframe[]
  },

  // Streak Indicator
  STREAK_GLOW: {
    duration: ANIMATION_DURATION.SLOW,
    easing: ANIMATION_EASING.EASE_IN_OUT,
    keyframes: [
      { 
        boxShadow: '0 0 10px rgba(34, 197, 94, 0.3)',
        transform: 'scale(1)',
        filter: 'brightness(1) saturate(1)'
      },
      { 
        boxShadow: '0 0 30px rgba(34, 197, 94, 0.8), 0 0 50px rgba(34, 197, 94, 0.4)',
        transform: 'scale(1.05)',
        filter: 'brightness(1.3) saturate(1.5)'
      },
      { 
        boxShadow: '0 0 10px rgba(34, 197, 94, 0.3)',
        transform: 'scale(1)',
        filter: 'brightness(1) saturate(1)'
      }
    ] as Keyframe[]
  },

  // Reaction Emoji Pop
  REACTION_POP: {
    duration: ANIMATION_DURATION.NORMAL,
    easing: ANIMATION_EASING.BOUNCE,
    keyframes: [
      { transform: 'scale(0) rotate(0deg)', opacity: 0 },
      { transform: 'scale(1.3) rotate(5deg)', opacity: 1 },
      { transform: 'scale(0.9) rotate(-3deg)', opacity: 1 },
      { transform: 'scale(1) rotate(0deg)', opacity: 1 }
    ] as Keyframe[]
  },

  // Achievement Badge Unlock
  ACHIEVEMENT_UNLOCK: {
    duration: ANIMATION_DURATION.GRANDIOSE,
    easing: ANIMATION_EASING.ELASTIC,
    keyframes: [
      { 
        transform: 'scale(0) rotateY(0deg)', 
        opacity: 0,
        filter: 'brightness(2) saturate(2) blur(3px)'
      },
      { 
        transform: 'scale(1.2) rotateY(180deg)', 
        opacity: 0.8,
        filter: 'brightness(1.5) saturate(1.5) blur(1px)'
      },
      { 
        transform: 'scale(0.9) rotateY(270deg)', 
        opacity: 0.9,
        filter: 'brightness(1.2) saturate(1.2) blur(0.5px)'
      },
      { 
        transform: 'scale(1) rotateY(360deg)', 
        opacity: 1,
        filter: 'brightness(1) saturate(1) blur(0px)'
      }
    ] as Keyframe[]
  }
} as const;

// Animation Manager Class
export class AnimationSystem {
  private static instance: AnimationSystem;
  private activeAnimations = new Map<string, Animation>();
  private animationId = 0;

  static getInstance(): AnimationSystem {
    if (!AnimationSystem.instance) {
      AnimationSystem.instance = new AnimationSystem();
    }
    return AnimationSystem.instance;
  }

  // Core animation method
  async animate(
    element: HTMLElement,
    animationKey: keyof typeof ANIMATIONS,
    options?: Partial<AnimationConfig>
  ): Promise<void> {
    const animation = ANIMATIONS[animationKey];
    const config = {
      duration: animation.duration,
      easing: animation.easing,
      fillMode: 'forwards' as const,
      ...options
    };

    return new Promise((resolve, reject) => {
      try {
        const webAnimation = element.animate(animation.keyframes, {
          duration: config.duration,
          easing: config.easing,
          delay: config.delay || 0,
          fill: config.fillMode
        });

        const id = `animation-${++this.animationId}`;
        this.activeAnimations.set(id, webAnimation);

        webAnimation.addEventListener('finish', () => {
          this.activeAnimations.delete(id);
          resolve();
        });

        webAnimation.addEventListener('cancel', () => {
          this.activeAnimations.delete(id);
          reject(new Error('Animation cancelled'));
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  // Staggered animations for multiple elements
  async animateStaggered(
    elements: HTMLElement[],
    animationKey: keyof typeof ANIMATIONS,
    staggerDelay: number = 100,
    options?: Partial<AnimationConfig>
  ): Promise<void> {
    const promises = elements.map((element, index) =>
      this.animate(element, animationKey, {
        ...options,
        delay: (options?.delay || 0) + (index * staggerDelay)
      })
    );

    await Promise.all(promises);
  }

  // CSS class generator for animations
  generateCSSClass(animationKey: keyof typeof ANIMATIONS): string {
    const animation = ANIMATIONS[animationKey];
    const className = `animate-${animationKey.toLowerCase().replace(/_/g, '-')}`;
    
    // Dynamic CSS injection (for shimmer and other effects)
    if (!document.querySelector(`style[data-animation="${className}"]`)) {
      const style = document.createElement('style');
      style.setAttribute('data-animation', className);
      
      let cssText = '';
      
      if (animationKey === 'CARD_SHIMMER') {
        cssText = `
          .${className} {
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
            background-size: 200px 100%;
            animation: shimmer ${animation.duration}ms ${animation.easing} infinite;
          }
          
          @keyframes shimmer {
            0% { background-position: -200px 0; }
            100% { background-position: 200px 0; }
          }
        `;
      } else {
        // Generate keyframes from animation definition
        const keyframeName = `keyframes-${className}`;
        cssText = `
          .${className} {
            animation: ${keyframeName} ${animation.duration}ms ${animation.easing} forwards;
          }
        `;
      }
      
      style.textContent = cssText;
      document.head.appendChild(style);
    }
    
    return className;
  }

  // Stop specific animation
  stopAnimation(animationId: string): void {
    const animation = this.activeAnimations.get(animationId);
    if (animation) {
      animation.cancel();
      this.activeAnimations.delete(animationId);
    }
  }

  // Stop all animations
  stopAllAnimations(): void {
    this.activeAnimations.forEach(animation => animation.cancel());
    this.activeAnimations.clear();
  }

  // Check if element supports animations
  supportsAnimations(): boolean {
    return typeof HTMLElement !== 'undefined' && 'animate' in HTMLElement.prototype;
  }
}

// React Hook for Animation System
export const useAnimationSystem = () => {
  const animationSystem = AnimationSystem.getInstance();

  const animateElement = async (
    elementRef: React.RefObject<HTMLElement>,
    animationKey: keyof typeof ANIMATIONS,
    options?: Partial<AnimationConfig>
  ) => {
    if (elementRef.current && animationSystem.supportsAnimations()) {
      await animationSystem.animate(elementRef.current, animationKey, options);
    }
  };

  const animateStaggered = async (
    elementRefs: React.RefObject<HTMLElement>[],
    animationKey: keyof typeof ANIMATIONS,
    staggerDelay?: number,
    options?: Partial<AnimationConfig>
  ) => {
    const elements = elementRefs
      .map(ref => ref.current)
      .filter((el): el is HTMLElement => el !== null);
    
    if (elements.length > 0 && animationSystem.supportsAnimations()) {
      await animationSystem.animateStaggered(elements, animationKey, staggerDelay, options);
    }
  };

  const getCSSClass = (animationKey: keyof typeof ANIMATIONS) => {
    return animationSystem.generateCSSClass(animationKey);
  };

  return {
    animateElement,
    animateStaggered,
    getCSSClass,
    stopAllAnimations: () => animationSystem.stopAllAnimations(),
  };
};

export default AnimationSystem;