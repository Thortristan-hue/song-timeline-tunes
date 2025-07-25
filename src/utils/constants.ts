/**
 * Game Constants
 * Centralized constants for the music timeline game
 */

// Game Modes
export const GAME_MODES = {
  CLASSIC: 'classic',
  FIEND: 'fiend',
  SPRINT: 'sprint'
} as const;

// Game Configuration
export const GAME_CONFIG = {
  DEFAULT_SONGS_COUNT: 20,
  MAX_TIMELINE_SONGS: 10,
  DEFAULT_ROUND_TIME: 30, // seconds
  TIMEOUT_DURATION: 5, // seconds for Sprint mode
  AUDIO_PREVIEW_DURATION: 30 // seconds
} as const;

// Fiend Mode Configuration
export const FIEND_MODE = {
  MIN_YEAR: 1950,
  MAX_YEAR: new Date().getFullYear(),
  DEFAULT_ROUNDS: 5,
  MIN_ROUNDS: 3,
  MAX_ROUNDS: 10
} as const;

// Sprint Mode Configuration
export const SPRINT_MODE = {
  DEFAULT_TARGET_CARDS: 10,
  MIN_TARGET_CARDS: 5,
  MAX_TARGET_CARDS: 20,
  TIMEOUT_DURATION: 5 // seconds
} as const;

// UI Constants
export const UI_CONSTANTS = {
  ANIMATION_DURATION: 300, // milliseconds
  TOAST_DURATION: 3000, // milliseconds
  CARD_COLORS: [
    '#3B82F6', // blue
    '#10B981', // emerald
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // violet
    '#F97316', // orange
    '#14B8A6', // teal
    '#EC4899'  // pink
  ]
} as const;

// Audio Constants
export const AUDIO_CONFIG = {
  DEFAULT_VOLUME: 0.7,
  FADE_DURATION: 1000, // milliseconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000 // milliseconds
} as const;

// Database Constants
export const DB_CONSTANTS = {
  SUPABASE_TABLE_ROOMS: 'game_rooms',
  SUPABASE_TABLE_PLAYERS: 'players',
  SUPABASE_TABLE_MOVES: 'game_moves'
} as const;