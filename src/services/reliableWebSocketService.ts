
import { GameService } from './gameService';
import { Song } from '@/types/game';
import { suppressUnused } from '@/utils/suppressUnused';

export class ReliableWebSocketService {
  private gameService = new GameService();

  private handleMessage = (message: any) => {
    console.log('WebSocket message:', message);
  };

  async initializeGame(roomId: string, songs: Song[]): Promise<void> {
    try {
      // Suppress unused warning for now - will be used when message handling is implemented
      suppressUnused(this.handleMessage);
      
      await this.gameService.initializeGameWithStartingCards(roomId, songs);
    } catch (error) {
      console.error('Failed to initialize game:', error);
      throw error;
    }
  }
}
