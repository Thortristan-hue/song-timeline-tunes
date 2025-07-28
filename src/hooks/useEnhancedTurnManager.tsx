import React, { useState, useCallback, useEffect } from 'react';
import { Song, Player } from '@/types/game';
import { turnManager, TurnTransitionState } from '@/lib/TurnManager';
import { useToast } from '@/components/ui/use-toast';

interface EnhancedTurnHookProps {
  roomId: string;
  availableSongs: Song[];
  allPlayers: Player[];
  currentPlayer: Player | null;
}

interface EnhancedTurnHookReturn {
  transitionState: TurnTransitionState;
  isTransitioning: boolean;
  placeCardWithAnimation: (song: Song, position: number) => Promise<{ success: boolean; correct?: boolean; error?: string }>;
  forceResetTransition: () => void;
  validateMysterySystem: () => Promise<void>;
}

/**
 * Enhanced hook for turn management with animation coordination
 */
export const useEnhancedTurnManager = ({
  roomId,
  availableSongs,
  allPlayers,
  currentPlayer
}: EnhancedTurnHookProps): EnhancedTurnHookReturn => {
  const { toast } = useToast();
  const [transitionState, setTransitionState] = useState<TurnTransitionState>({
    phase: 'idle',
    animationProgress: 0,
    currentAnimation: null
  });

  // Set up state change listener
  useEffect(() => {
    turnManager.setStateChangeListener(setTransitionState);
    return () => {
      turnManager.setStateChangeListener(() => {});
    };
  }, []);

  // Enhanced card placement with animation coordination
  const placeCardWithAnimation = useCallback(async (
    song: Song, 
    position: number
  ): Promise<{ success: boolean; correct?: boolean; error?: string }> => {
    if (!currentPlayer) {
      toast({
        title: "Error",
        description: "No current player found",
        variant: "destructive",
      });
      return { success: false, error: "No current player" };
    }

    if (transitionState.phase !== 'idle') {
      console.warn('🚫 TURN MANAGER: Cannot place card while transitioning');
      return { success: false, error: "Turn transition in progress" };
    }

    console.log('🎯 ENHANCED TURN HOOK: Starting card placement with animations');

    try {
      const result = await turnManager.placeCardAndAdvanceTurn(
        roomId,
        currentPlayer.id,
        song,
        position,
        availableSongs,
        currentPlayer,
        allPlayers
      );

      if (result.success) {
        toast({
          title: result.correct ? "Correct!" : "Incorrect",
          description: result.correct 
            ? `${song.deezer_title} placed correctly!` 
            : `${song.deezer_title} was placed incorrectly`,
          variant: result.correct ? "default" : "destructive",
        });

        console.log('✅ ENHANCED TURN HOOK: Card placement completed successfully');
      } else {
        toast({
          title: "Placement Failed",
          description: result.error || "Failed to place card",
          variant: "destructive",
        });

        console.error('❌ ENHANCE TURN HOOK: Card placement failed:', result.error);
      }

      return {
        success: result.success,
        correct: result.correct,
        error: result.error
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ ENHANCED TURN HOOK: Exception during card placement:', error);
      
      toast({
        title: "Unexpected Error",
        description: errorMessage,
        variant: "destructive",
      });

      return {
        success: false,
        error: errorMessage
      };
    }
  }, [roomId, currentPlayer, availableSongs, allPlayers, transitionState.phase, toast]);

  // Force reset transition state
  const forceResetTransition = useCallback(() => {
    console.log('🔄 ENHANCED TURN HOOK: Force resetting transition state');
    turnManager.forceReset();
    
    toast({
      title: "Turn Reset",
      description: "Turn transition has been reset",
      variant: "default",
    });
  }, [toast]);

  // Validate mystery song system
  const validateMysterySystem = useCallback(async () => {
    console.log('🔍 ENHANCED TURN HOOK: Validating mystery song system');
    
    try {
      const usedSongs = allPlayers.reduce((acc, player) => {
        if (player.timeline && Array.isArray(player.timeline)) {
          acc.push(...player.timeline);
        }
        return acc;
      }, [] as Song[]);

      const validation = await turnManager.validateMysteryCardSystem(
        roomId,
        availableSongs,
        usedSongs
      );

      if (validation.isValid) {
        toast({
          title: "System Validation",
          description: "Mystery song system is functioning correctly",
          variant: "default",
        });
        console.log('✅ ENHANCED TURN HOOK: Mystery song system validation passed');
      } else {
        console.warn('⚠️ ENHANCED TURN HOOK: Mystery song system validation issues:', validation.issues);
        
        toast({
          title: "System Issues Detected",
          description: `Found ${validation.issues.length} issues with mystery song system`,
          variant: "destructive",
        });

        // Log detailed information
        console.log('🔍 VALIDATION DETAILS:', {
          issues: validation.issues,
          recommendations: validation.recommendations,
          availableSongs: availableSongs.length,
          usedSongs: usedSongs.length,
          totalPlayers: allPlayers.length
        });
      }
    } catch (error) {
      console.error('❌ ENHANCED TURN HOOK: Mystery system validation failed:', error);
      
      toast({
        title: "Validation Failed",
        description: "Could not validate mystery song system",
        variant: "destructive",
      });
    }
  }, [roomId, availableSongs, allPlayers, toast]);

  return {
    transitionState,
    isTransitioning: transitionState.phase !== 'idle',
    placeCardWithAnimation,
    forceResetTransition,
    validateMysterySystem
  };
};