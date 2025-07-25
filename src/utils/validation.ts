/**
 * Validation Utilities
 * Common validation functions for the music timeline game
 */

import { Song, Player, GameRoom } from "@/types/game";

/**
 * Validates if a song object has all required properties
 */
export function isValidSong(song: any): song is Song {
  return (
    song &&
    typeof song === 'object' &&
    typeof song.id === 'string' &&
    typeof song.deezer_title === 'string' &&
    typeof song.deezer_artist === 'string' &&
    typeof song.release_year === 'string' &&
    song.id.length > 0 &&
    song.deezer_title.length > 0 &&
    song.deezer_artist.length > 0 &&
    song.release_year.length > 0
  );
}

/**
 * Validates if a player object has all required properties
 */
export function isValidPlayer(player: any): player is Player {
  return (
    player &&
    typeof player === 'object' &&
    typeof player.id === 'string' &&
    typeof player.name === 'string' &&
    typeof player.color === 'string' &&
    Array.isArray(player.timeline) &&
    typeof player.score === 'number' &&
    player.id.length > 0 &&
    player.name.length > 0
  );
}

/**
 * Validates if a game room object has all required properties
 */
export function isValidGameRoom(room: any): room is GameRoom {
  return (
    room &&
    typeof room === 'object' &&
    typeof room.id === 'string' &&
    typeof room.lobby_code === 'string' &&
    typeof room.host_id === 'string' &&
    typeof room.gamemode === 'string' &&
    Array.isArray(room.songs) &&
    room.id.length > 0 &&
    room.lobby_code.length > 0 &&
    room.host_id.length > 0
  );
}

/**
 * Validates if a year is within valid range
 */
export function isValidYear(year: number): boolean {
  const currentYear = new Date().getFullYear();
  return year >= 1950 && year <= currentYear;
}

/**
 * Validates if a position is valid for a timeline
 */
export function isValidTimelinePosition(position: number, timelineLength: number): boolean {
  return position >= 0 && position <= timelineLength;
}

/**
 * Validates if a lobby code has the correct format
 */
export function isValidLobbyCode(code: string): boolean {
  return /^[A-Z0-9]{4,6}$/.test(code);
}

/**
 * Validates if a player name is acceptable
 */
export function isValidPlayerName(name: string): boolean {
  return (
    typeof name === 'string' &&
    name.trim().length >= 1 &&
    name.trim().length <= 20 &&
    /^[a-zA-Z0-9\s\-_]+$/.test(name.trim())
  );
}

/**
 * Validates if an audio URL is accessible
 */
export function isValidAudioUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'https:' && urlObj.hostname.includes('deezer');
  } catch {
    return false;
  }
}

/**
 * Validates if a color is a valid hex color
 */
export function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}