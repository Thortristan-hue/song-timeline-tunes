
import { Song, Player } from '@/types/game';
import { suppressUnused } from '@/utils/suppressUnused';

export async function validateCardPlacement(
  song: Song, 
  timeline: Song[], 
  position: number,
  currentPlayer: Player
): Promise<boolean> {
  suppressUnused(currentPlayer); // Suppress unused parameter
  
  if (!song || !timeline) {
    console.warn('Missing song or timeline data for validation');
    return false;
  }

  if (position < 0 || position > timeline.length) {
    console.warn('Invalid position for card placement');
    return false;
  }

  // Edge case: empty timeline
  if (timeline.length === 0) {
    return true;
  }

  // Edge case: placing at the beginning
  if (position === 0) {
    const nextSong = timeline[0];
    return song.release_year <= nextSong.release_year;
  }

  // Edge case: placing at the end
  if (position === timeline.length) {
    const prevSong = timeline[position - 1];
    return song.release_year >= prevSong.release_year;
  }

  // General case: placing in the middle
  const prevSong = timeline[position - 1];
  const nextSong = timeline[position];

  return song.release_year >= prevSong.release_year && song.release_year <= nextSong.release_year;
}
