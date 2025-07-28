/**
 * Enhanced Turn Management System
 * 
 * Coordinates turn changes with animation system for smooth gameplay
 * Ensures proper mystery song selection and turn advancement
 */

import { Song, Player, GameRoom } from '@/types/game';
import { animationManager } from '@/lib/AnimationManager';
import { GameService } from '@/services/gameService';

export interface TurnTransitionState {
  phase: 'idle' | 'card-falling' | 'turn-ending' | 'turn-starting' | 'mystery-revealing';
  animationProgress: number;
  currentAnimation: string | null;
}

export interface TurnChangeResult {
  success: boolean;
  newMysteryCard?: Song;
  nextPlayer?: Player;
  animationsCompleted: boolean;
  correct: boolean;  // Made required to match GameService
  error?: string;
  gameEnded?: boolean;
  winner?: Player;
}

export class TurnManager {
  private static instance: TurnManager;
  private transitionState: TurnTransitionState = {
    phase: 'idle',
    animationProgress: 0,
    currentAnimation: null
  };
  private onStateChange?: (state: TurnTransitionState) => void;

  static getInstance(): TurnManager {
    if (!TurnManager.instance) {
      TurnManager.instance = new TurnManager();
    }
    return TurnManager.instance;
  }

  /**
   * Set callback for turn state changes
   */
  setStateChangeListener(callback: (state: TurnTransitionState) => void) {
    this.onStateChange = callback;
  }

  /**
   * Update transition state and notify listeners
   */
  private updateState(updates: Partial<TurnTransitionState>) {
    this.transitionState = { ...this.transitionState, ...updates };
    this.onStateChange?.(this.transitionState);
  }

  /**
   * Enhanced card placement with coordinated turn advancement
   */
  async placeCardAndAdvanceTurn(
    roomId: string,
    playerId: string,
    song: Song,
    position: number,
    availableSongs: Song[],
    currentPlayer: Player,
    allPlayers: Player[]
  ): Promise<TurnChangeResult> {
    console.log('🎯 TURN MANAGER: Starting enhanced card placement and turn advancement');

    try {
      // Phase 1: Card falling animation
      this.updateState({
        phase: 'card-falling',
        animationProgress: 0,
        currentAnimation: 'CARD_FALL'
      });

      // Animate card falling with proper coordination
      await this.animateCardPlacement(song, position);

      // Phase 2: Process the card placement
      console.log('🃏 TURN MANAGER: Processing card placement in GameService');
      const placementResult = await GameService.placeCardAndAdvanceTurn(
        roomId,
        playerId,
        song,
        position,
        availableSongs
      );

      if (!placementResult.success) {
        console.error('❌ TURN MANAGER: Card placement failed');
        this.updateState({ phase: 'idle', currentAnimation: null });
        return {
          success: false,
          animationsCompleted: true,
          correct: false,
          error: placementResult.error
        };
      }

      // Phase 3: Turn ending animations
      this.updateState({
        phase: 'turn-ending',
        animationProgress: 50,
        currentAnimation: 'TURN_TRANSITION'
      });

      await this.animateTurnEnding(currentPlayer, placementResult.correct || false);

      // Phase 4: Turn starting animations for next player
      this.updateState({
        phase: 'turn-starting',
        animationProgress: 75,
        currentAnimation: 'PLAYER_TRANSITION'
      });

      const nextPlayerIndex = this.getNextPlayerIndex(playerId, allPlayers);
      const nextPlayer = allPlayers[nextPlayerIndex];

      if (nextPlayer) {
        await this.animateTurnStarting(nextPlayer);
      }

      // Phase 5: Mystery card revealing
      this.updateState({
        phase: 'mystery-revealing',
        animationProgress: 90,
        currentAnimation: 'MYSTERY_REVEAL'
      });

      // Get the new mystery card from the room (it was set by GameService)
      const newMysteryCard = await this.getCurrentMysteryCard(roomId);

      if (newMysteryCard) {
        await this.animateMysteryCardReveal(newMysteryCard);
      }

      // Phase 6: Complete
      this.updateState({
        phase: 'idle',
        animationProgress: 100,
        currentAnimation: null
      });

      console.log('✅ TURN MANAGER: Turn advancement completed successfully');

      return {
        success: true,
        newMysteryCard,
        nextPlayer,
        animationsCompleted: true,
        correct: placementResult.correct || false,
        gameEnded: placementResult.gameEnded || false,
        winner: placementResult.winner
      };

    } catch (error) {
      console.error('❌ TURN MANAGER: Turn advancement failed:', error);
      this.updateState({ phase: 'idle', currentAnimation: null });
      return {
        success: false,
        animationsCompleted: true,
        correct: false,
        error: error instanceof Error ? error.message : 'Turn advancement failed'
      };
    }
  }

  /**
   * Animate card placement with enhanced effects
   */
  private async animateCardPlacement(song: Song, position: number): Promise<void> {
    console.log('🎬 TURN MANAGER: Animating card placement');
    
    // Use the animation manager for consistent card falling animation
    const cardElement = document.createElement('div');
    await animationManager.animateCardFallCorrect({
      element: cardElement,
      song,
      targetPosition: position,
      isCorrect: true
    }, {
      duration: 2.0, // 2 seconds for dramatic effect
      onUpdate: () => {
        this.updateState({ animationProgress: (this.transitionState.animationProgress || 0) + 1 });
      }
    });
  }

  /**
   * Animate turn ending with player feedback
   */
  private async animateTurnEnding(currentPlayer: Player, wasCorrect: boolean): Promise<void> {
    console.log('🎬 TURN MANAGER: Animating turn ending');
    
    // Show feedback animation with fake elements for now
    const elements = Array.from({ length: currentPlayer.timeline.length }, () => document.createElement('div'));
    
    if (wasCorrect) {
      // Simulate correct placement feedback
      console.log('🎉 Correct placement animation for player:', currentPlayer.name);
    } else {
      // Simulate incorrect placement feedback
      console.log('❌ Incorrect placement animation for player:', currentPlayer.name);
    }

    // Cards bunch up animation
    await animationManager.animateCardsBunchUp(elements);
  }

  /**
   * Animate turn starting for next player
   */
  private async animateTurnStarting(nextPlayer: Player): Promise<void> {
    console.log('🎬 TURN MANAGER: Animating turn starting for', nextPlayer.name);
    
    // Player highlight animation
    console.log('🎯 Player highlight animation for:', nextPlayer.name);
    
    // Cards spread out animation for new turn
    const elements = Array.from({ length: nextPlayer.timeline.length }, () => document.createElement('div'));
    await animationManager.animateCardsSpreadOut(elements);
  }

  /**
   * Animate mystery card reveal
   */
  private async animateMysteryCardReveal(mysteryCard: Song): Promise<void> {
    console.log('🎬 TURN MANAGER: Animating mystery card reveal:', mysteryCard.deezer_title);
    
    // Simulate mystery card reveal animation
    console.log('🎴 Mystery card reveal animation for:', mysteryCard.deezer_title);
    
    // Create a temporary element for animation
    const cardElement = document.createElement('div');
    await animationManager.animateCardFallCorrect({
      element: cardElement,
      song: mysteryCard,
      targetPosition: 0,
      isCorrect: true
    }, {
      duration: 1.5
    });
  }

  /**
   * Get current mystery card from room
   */
  private async getCurrentMysteryCard(roomId: string): Promise<Song | null> {
    try {
      // This would typically fetch from the database
      // For now, we'll return null and let the existing system handle it
      return null;
    } catch (error) {
      console.error('Failed to get current mystery card:', error);
      return null;
    }
  }

  /**
   * Calculate next player index
   */
  private getNextPlayerIndex(currentPlayerId: string, allPlayers: Player[]): number {
    const currentIndex = allPlayers.findIndex(p => p.id === currentPlayerId);
    return (currentIndex + 1) % allPlayers.length;
  }

  /**
   * Get current transition state
   */
  getTransitionState(): TurnTransitionState {
    return { ...this.transitionState };
  }

  /**
   * Check if currently transitioning
   */
  isTransitioning(): boolean {
    return this.transitionState.phase !== 'idle';
  }

  /**
   * Force reset to idle state (for emergency cleanup)
   */
  forceReset(): void {
    console.log('🔄 TURN MANAGER: Force reset to idle state');
    this.updateState({
      phase: 'idle',
      animationProgress: 0,
      currentAnimation: null
    });
  }

  /**
   * Validate mystery song selection system
   */
  async validateMysteryCardSystem(
    roomId: string,
    availableSongs: Song[],
    usedSongs: Song[]
  ): Promise<{ isValid: boolean; issues: string[]; recommendations: string[] }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check available songs count
    if (availableSongs.length < 5) {
      issues.push(`Low available songs count: ${availableSongs.length}`);
      recommendations.push('Consider loading more songs or resetting used songs pool');
    }

    // Check for duplicate songs
    const songIds = availableSongs.map(s => s.id);
    const duplicates = songIds.filter((id, index) => songIds.indexOf(id) !== index);
    if (duplicates.length > 0) {
      issues.push(`Duplicate songs detected: ${duplicates.length}`);
      recommendations.push('Remove duplicate songs from available pool');
    }

    // Check for songs without preview URLs
    const songsWithoutPreview = availableSongs.filter(s => !s.preview_url);
    if (songsWithoutPreview.length > 0) {
      issues.push(`Songs without preview: ${songsWithoutPreview.length}`);
      recommendations.push('Filter out songs without valid preview URLs');
    }

    // Check used songs ratio
    const totalSongs = availableSongs.length + usedSongs.length;
    const usedRatio = usedSongs.length / totalSongs;
    if (usedRatio > 0.8) {
      issues.push(`High used songs ratio: ${(usedRatio * 100).toFixed(1)}%`);
      recommendations.push('Consider expanding the song pool or implementing song recycling');
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    };
  }
}

// Export singleton instance
export const turnManager = TurnManager.getInstance();

// Export React hook (will need to be imported from React in the component)
// React hook for turn manager (to be used with React import)
export const useTurnManager = () => {
  // This will be implemented by components that need React hooks
  return {
    transitionState: turnManager.getTransitionState(),
    placeCardAndAdvanceTurn: turnManager.placeCardAndAdvanceTurn.bind(turnManager),
    isTransitioning: turnManager.isTransitioning.bind(turnManager),
    forceReset: turnManager.forceReset.bind(turnManager),
    validateMysteryCardSystem: turnManager.validateMysteryCardSystem.bind(turnManager)
  };
};