
import { GameService } from './gameService';
import { suppressUnused } from '@/utils/suppressUnused';

export class ReliableWebSocketService {
  private gameService = new GameService();

  async initializeGame(roomId: string, hostId: string): Promise<void> {
    try {
      await this.gameService.initializeGameWithStartingCards(roomId, hostId);
    } catch (error) {
      console.error('Failed to initialize game:', error);
      throw error;
    }
  }
}
