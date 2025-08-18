import { GameService } from './gameService';
import { suppressUnused } from '@/utils/suppressUnused';

export class ReliableWebSocketService {
  private gameService = new GameService();

  private handleMessage(roomId: string, payload: any): void {
    suppressUnused(roomId);
    // Handle incoming messages from WebSocket
    console.log('Received message:', payload);
  }

  async initializeGame(roomId: string, hostId: string): Promise<void> {
    try {
      await this.gameService.initializeGame(roomId, hostId);
    } catch (error) {
      console.error('Failed to initialize game:', error);
      throw error;
    }
  }
}
