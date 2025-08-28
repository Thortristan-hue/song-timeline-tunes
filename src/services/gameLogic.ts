
import { GameRoom, Player, Song } from '@/types/game';
import { songDeckUtils } from './songDeckManager';

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

  /**
   * IMPROVED: Get random available song with better validation
   * This is a fallback method - prefer using SongDeckManager for mystery cards
   */
  getRandomAvailableSong(): Song | null {
    const available = this.availableSongs.filter(songDeckUtils.isValidSong);
    
    if (available.length === 0) {
      console.warn('⚠️ No valid songs available in GameLogic');
      return null;
    }
    
    // Use better randomization
    const randomIndex = Math.floor(Math.random() * available.length);
    const selectedSong = available[randomIndex];
    
    console.log('🎵 GameLogic selected random song:', selectedSong.deezer_title);
    return selectedSong;
  }

  /**
   * Get songs that are currently in use (on player timelines)
   */
  getUsedSongs(): Song[] {
    const usedSongs: Song[] = [];
    
    this.players.forEach(player => {
      if (Array.isArray(player.timeline)) {
        player.timeline.forEach(song => {
          if (songDeckUtils.isValidSong(song)) {
            usedSongs.push(song);
          }
        });
      }
    });
    
    // Add current mystery song if exists
    if (this.room.current_song && songDeckUtils.isValidSong(this.room.current_song)) {
      usedSongs.push(this.room.current_song);
    }
    
    return usedSongs;
  }

  /**
   * Get songs that are available for new mystery cards
   */
  getAvailableForMystery(): Song[] {
    const allSongs = this.availableSongs.filter(songDeckUtils.isValidSong);
    const usedSongs = this.getUsedSongs();
    const usedSongIds = new Set(usedSongs.map(s => s.id));
    
    return allSongs.filter(song => !usedSongIds.has(song.id));
  }

  /**
   * Check if the game should end (no more available songs)
   */
  shouldEndGame(): boolean {
    return this.getAvailableForMystery().length === 0;
  }

  checkWinCondition(): Player | null {
    // Simple win condition: first player to reach 9 points (10 cards total including starting card)
    const winner = this.players.find(player => player.score >= 9);
    return winner || null;
  }

  /**
   * Validate a card placement in timeline
   */
  validateCardPlacement(playerTimeline: Song[], newSong: Song, position: number): boolean {
    if (!songDeckUtils.isValidSong(newSong)) {
      console.error('❌ Invalid song for placement:', newSong);
      return false;
    }
    
    // Create new timeline with inserted song
    const newTimeline = [...playerTimeline];
    newTimeline.splice(position, 0, newSong);
    
    // Check if timeline is correctly sorted by year
    for (let i = 1; i < newTimeline.length; i++) {
      const prevYear = parseInt(newTimeline[i - 1].release_year);
      const currYear = parseInt(newTimeline[i].release_year);
      
      if (prevYear > currYear) {
        return false;
      }
    }
    
    return true;
  }
}
