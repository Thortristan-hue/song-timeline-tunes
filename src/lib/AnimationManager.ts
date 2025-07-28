/**
 * Advanced Animation Manager using GSAP
 * Provides high-performance, interruptible animations for card placement and UI transitions
 */

import { gsap } from 'gsap';

export interface AnimationConfig {
  duration?: number;
  ease?: string;
  delay?: number;
  onComplete?: () => void;
  onStart?: () => void;
  onUpdate?: () => void;
}

export interface CardAnimationData {
  element: HTMLElement;
  song: {
    deezer_title: string;
    deezer_artist: string;
    release_year: string;
  };
  targetPosition: number;
  isCorrect?: boolean;
}

class AnimationManager {
  private activeAnimations: Map<string, gsap.core.Timeline> = new Map();
  private masterTimeline: gsap.core.Timeline | null = null;

  constructor() {
    // Configure GSAP defaults for optimal performance
    gsap.config({
      force3D: true,
      nullTargetWarn: false,
    });

    // Set default easing
    gsap.defaults({
      ease: "power2.out",
      duration: 0.6,
    });
  }

  /**
   * Creates an interruptible timeline that can be stopped and reset
   */
  private createTimeline(id: string): gsap.core.Timeline {
    // Kill existing animation with same ID
    this.killAnimation(id);
    
    const timeline = gsap.timeline({
      paused: true,
      onComplete: () => {
        this.activeAnimations.delete(id);
      },
    });
    
    this.activeAnimations.set(id, timeline);
    return timeline;
  }

  /**
   * Kill specific animation by ID
   */
  killAnimation(id: string): void {
    const animation = this.activeAnimations.get(id);
    if (animation) {
      animation.kill();
      this.activeAnimations.delete(id);
    }
  }

  /**
   * Kill all active animations
   */
  killAllAnimations(): void {
    this.activeAnimations.forEach((animation) => {
      animation.kill();
    });
    this.activeAnimations.clear();
    
    if (this.masterTimeline) {
      this.masterTimeline.kill();
      this.masterTimeline = null;
    }
  }

  /**
   * Card falling animation for correct placement
   */
  animateCardFallCorrect(data: CardAnimationData, config: AnimationConfig = {}): Promise<void> {
    return new Promise((resolve) => {
      const timeline = this.createTimeline(`card-fall-correct-${Date.now()}`);
      const { element } = data;

      // Set initial state
      gsap.set(element, {
        y: -window.innerHeight * 1.2,
        x: "50%",
        xPercent: -50,
        scale: 0.7,
        rotation: -8,
        opacity: 0,
        filter: "blur(3px)",
      });

      timeline
        // Entrance with bounce
        .to(element, {
          y: -30,
          scale: 0.85,
          rotation: -4,
          opacity: 0.6,
          filter: "blur(2px)",
          duration: 0.4,
          ease: "power2.out",
        })
        // Peak bounce
        .to(element, {
          y: -8,
          scale: 1.08,
          rotation: 3,
          opacity: 0.9,
          filter: "blur(1px)",
          duration: 0.3,
          ease: "power1.inOut",
        })
        // Settle
        .to(element, {
          y: 2,
          scale: 0.98,
          rotation: -1,
          opacity: 0.98,
          filter: "blur(0.5px)",
          duration: 0.2,
          ease: "power2.in",
        })
        // Final position
        .to(element, {
          y: 0,
          scale: 1,
          rotation: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.3,
          ease: "elastic.out(1, 0.5)",
          onComplete: () => {
            config.onComplete?.();
            resolve();
          },
        });

      timeline.play();
    });
  }

  /**
   * Card falling animation for incorrect placement
   */
  animateCardFallIncorrect(data: CardAnimationData, config: AnimationConfig = {}): Promise<void> {
    return new Promise((resolve) => {
      const timeline = this.createTimeline(`card-fall-incorrect-${Date.now()}`);
      const { element } = data;

      // Set initial state
      gsap.set(element, {
        y: -window.innerHeight * 1.2,
        x: "50%",
        xPercent: -50,
        scale: 1,
        rotation: 0,
        opacity: 1,
        filter: "blur(0px)",
      });

      timeline
        // Chaotic fall with multiple rotations
        .to(element, {
          y: window.innerHeight * 1.5,
          rotation: 720,
          scale: 0.5,
          opacity: 0,
          filter: "blur(4px)",
          duration: 2.2,
          ease: "power2.in",
          onComplete: () => {
            config.onComplete?.();
            resolve();
          },
        });

      timeline.play();
    });
  }

  /**
   * Timeline cards spread out animation
   */
  animateCardsSpreadOut(elements: HTMLElement[], config: AnimationConfig = {}): Promise<void> {
    return new Promise((resolve) => {
      const timeline = this.createTimeline(`cards-spread-${Date.now()}`);

      elements.forEach((element, index) => {
        const delay = index * 0.05; // Stagger effect
        
        timeline.to(element, {
          x: 0,
          scale: 1,
          rotationY: 0,
          opacity: 1,
          filter: "blur(0px) brightness(1) saturate(1)",
          duration: 0.6,
          ease: "back.out(1.7)",
          delay,
        }, 0); // Start all animations at the same time with different delays
      });

      timeline.call(() => {
        config.onComplete?.();
        resolve();
      });

      timeline.play();
    });
  }

  /**
   * Timeline cards bunch up animation
   */
  animateCardsBunchUp(elements: HTMLElement[], config: AnimationConfig = {}): Promise<void> {
    return new Promise((resolve) => {
      const timeline = this.createTimeline(`cards-bunch-${Date.now()}`);

      elements.forEach((element, index) => {
        const delay = index * 0.03;
        
        timeline.to(element, {
          x: -100,
          scale: 0.5,
          rotationY: -30,
          opacity: 0.7,
          filter: "blur(3px) brightness(1.4) saturate(1.3)",
          duration: 0.8,
          ease: "power2.inOut",
          delay,
        }, 0);
      });

      timeline.call(() => {
        config.onComplete?.();
        resolve();
      });

      timeline.play();
    });
  }

  /**
   * Smooth card placement with make room animation
   */
  animateCardPlacement(
    newCard: HTMLElement,
    existingCards: HTMLElement[],
    insertIndex: number,
    config: AnimationConfig = {}
  ): Promise<void> {
    return new Promise((resolve) => {
      const timeline = this.createTimeline(`card-placement-${Date.now()}`);

      // First, make room by shifting existing cards
      existingCards.forEach((card, index) => {
        if (index >= insertIndex) {
          timeline.to(card, {
            x: "+=120", // Move cards to the right
            duration: 0.4,
            ease: "power2.inOut",
          }, 0);
        }
      });

      // Then animate new card into position
      timeline.to(newCard, {
        scale: 1,
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "back.out(1.7)",
        onComplete: () => {
          config.onComplete?.();
          resolve();
        },
      }, 0.2);

      timeline.play();
    });
  }

  /**
   * Player turn transition animation
   */
  animatePlayerTransition(
    outgoingElement: HTMLElement | null,
    incomingElement: HTMLElement,
    config: AnimationConfig = {}
  ): Promise<void> {
    return new Promise((resolve) => {
      const timeline = this.createTimeline(`player-transition-${Date.now()}`);

      if (outgoingElement) {
        timeline.to(outgoingElement, {
          scale: 0.9,
          opacity: 0,
          y: -20,
          duration: 0.3,
          ease: "power2.in",
        });
      }

      timeline.to(incomingElement, {
        scale: 1,
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: "back.out(1.7)",
        onComplete: () => {
          config.onComplete?.();
          resolve();
        },
      }, outgoingElement ? 0.15 : 0);

      timeline.play();
    });
  }

  /**
   * Universal playback controls animation (vinyl -> controls)
   */
  animatePlaybackTransition(element: HTMLElement, isPlaying: boolean): void {
    const timeline = this.createTimeline(`playback-${element.id || 'default'}`);

    if (isPlaying) {
      timeline.to(element, {
        rotation: "+=360",
        scale: 1.05,
        duration: 0.8,
        ease: "power2.out",
      });
    } else {
      timeline.to(element, {
        scale: 1,
        duration: 0.3,
        ease: "power2.out",
      });
    }

    timeline.play();
  }

  /**
   * Responsive mobile optimizations
   */
  optimizeForMobile(): void {
    // Reduce motion for low-end devices
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      gsap.globalTimeline.timeScale(2); // Speed up animations
    }

    // Optimize for small screens
    if (window.innerWidth < 768) {
      gsap.defaults({
        duration: 0.4, // Shorter animations on mobile
        ease: "power1.out",
      });
    }
  }

  /**
   * Cleanup method for component unmounting
   */
  cleanup(): void {
    this.killAllAnimations();
  }
}

// Singleton instance
export const animationManager = new AnimationManager();

// Initialize mobile optimizations
if (typeof window !== 'undefined') {
  animationManager.optimizeForMobile();
  
  // Re-optimize on resize
  window.addEventListener('resize', () => {
    animationManager.optimizeForMobile();
  });
}

export default AnimationManager;