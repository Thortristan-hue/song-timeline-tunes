import { Song, Player, GameRoom } from '@/types/game';

export interface IGameService {
  // Room and Player Management
  getRoomDetails(roomId: string): Promise<GameRoom | null>;
  getPlayer(playerId: string): Promise<Player | null>;
  
  // Game Initialization
  initializeGameWithStartingCards(roomId: string, songs: Song[]): Promise<void>;
  
  // Card Placement and Game Logic
  placeCard(roomId: string, playerId: string, song: Song, position: number): Promise<{
    success: boolean;
    correct?: boolean;
    gameEnded?: boolean;
    winner?: Player;
  }>;
  
  // Turn Management
  advanceTurn(roomId: string): Promise<void>;
  
  // Game State Management
  endGame(roomId: string): Promise<void>;
  checkIfGameEnded(roomId: string): Promise<boolean>;
  determineWinner(roomId: string): Promise<Player | null>;
  
  // Game Validation
  isCardPlacementCorrect(roomId: string, playerId: string, song: Song, position: number): Promise<boolean>;
  
  // Player Management
  awardPoints(roomId: string, playerId: string, points: number): Promise<void>;
  revertTimeline(roomId: string, playerId: string, position: number): Promise<void>;
}

// Legacy method mappings for backward compatibility
// @deprecated Use the canonical IGameService interface instead
export const LegacyGameServiceMethods = {
  // Add any legacy method names here if needed for gradual migration
  // Example: placeCardAndAdvanceTurn -> placeCard + advanceTurn
} as const;