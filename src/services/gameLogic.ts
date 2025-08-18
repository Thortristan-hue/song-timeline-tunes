
import { GameRoom, Player, Song } from '@/types/game';

export class GameLogic {
  private room: GameRoom;
  private players: Player[];
  private currentPlayer: Player;

  constructor(room: GameRoom, players: Player[], currentPlayer: Player) {
    this.room = room;
    this.players = players;
    this.currentPlayer = currentPlayer;
  }

  get availableSongs(): Song[] {
    return this.room.songs || [];
  }

  get isGameOver(): boolean {
    return this.room.phase === 'finished';
  }

  getRandomAvailableSong(): Song | null {
    const available = this.availableSongs;
    if (available.length === 0) return null;
    return available[Math.floor(Math.random() * available.length)];
  }

  checkWinCondition(): Player | null {
    // Simple win condition: first player to reach 10 points
    const winner = this.players.find(player => player.score >= 10);
    return winner || null;
  }
}
