// Unique Song Fetching Service
// Implements the server-side requirements from the problem statement
// Adapted for TypeScript + Supabase architecture

import { Song } from '@/types/game';

/**
 * Helper function that takes a Set of song IDs and returns a unique song
 * This implements the requirement from Part 1.1 of the problem statement
 */
export function fetchUniqueRandomSong(
  availableSongs: Song[], 
  usedSongIds: Set<string>
): Song | null {
  // Filter songs to get only ones whose IDs are NOT in the usedSongIds set
  const availableUniqueSongs = availableSongs.filter(song => 
    !usedSongIds.has(song.id)
  );
  
  // Return null if no unique songs are left
  if (availableUniqueSongs.length === 0) {
    console.log('⚠️ No unique songs left in deck');
    return null;
  }
  
  // Pick a random song from the available ones
  const randomIndex = Math.floor(Math.random() * availableUniqueSongs.length);
  const selectedSong = availableUniqueSongs[randomIndex];
  
  // Crucially, add the new song's ID to the usedSongIds set before returning
  usedSongIds.add(selectedSong.id);
  
  console.log('🎵 Selected unique song:', selectedSong.deezer_title, 'from', availableUniqueSongs.length, 'available');
  console.log('📦 Used songs count:', usedSongIds.size);
  
  return selectedSong;
}

/**
 * Initialize a room with unique song tracking
 * Returns an object with the initial state needed for unique song management
 */
export function initializeUniqueRoom() {
  return {
    usedSongIds: new Set<string>(),
    mysterySong: null as Song | null
  };
}

/**
 * Get a starting card for a newly joined player
 * Implements the JOIN_ROOM case requirement from Part 1.2
 */
export function getStartingCardForPlayer(
  availableSongs: Song[],
  usedSongIds: Set<string>
): Song | null {
  return fetchUniqueRandomSong(availableSongs, usedSongIds);
}

/**
 * Get the first mystery song when game starts
 * Implements the START_GAME case requirement from Part 1.2
 */
export function getFirstMysterySong(
  availableSongs: Song[],
  usedSongIds: Set<string>
): Song | null {
  return fetchUniqueRandomSong(availableSongs, usedSongIds);
}

/**
 * Get a new mystery song after a player guess
 * Implements the PLAYER_GUESS case requirement from Part 1.2
 */
export function getNewMysterySong(
  availableSongs: Song[],
  usedSongIds: Set<string>
): Song | null {
  return fetchUniqueRandomSong(availableSongs, usedSongIds);
}