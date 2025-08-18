
import { GameService } from './gameService';
import { Song } from '@/types/game';

export class ReliableWebSocketService {
  private gameService = new GameService();

  private handleMessage = (message: any) => {
    console.log('WebSocket message:', message);
  };

  async initializeGame(roomId: string, songs: Song[]): Promise<void> {
    try {
      await this.gameService.initializeGameWithStartingCards(roomId, songs);
    } catch (error) {
      console.error('Failed to initialize game:', error);
      throw error;
    }
  }
}
