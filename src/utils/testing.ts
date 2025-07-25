/**
 * Test Utilities
 * Helper functions for testing the music timeline game
 */

import { Song, Player, GameRoom } from "@/types/game";

/**
 * Creates a mock song for testing
 */
export function createMockSong(overrides: Partial<Song> = {}): Song {
  return {
    id: "test-song-1",
    deezer_title: "Test Song",
    deezer_artist: "Test Artist",
    deezer_album: "Test Album",
    release_year: "2000",
    genre: "Pop",
    cardColor: "#3B82F6",
    preview_url: "https://cdn-preview-test.deezer.com/stream/test",
    deezer_url: "https://deezer.com/track/test",
    ...overrides
  };
}

/**
 * Creates a mock player for testing
 */
export function createMockPlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: "test-player-1",
    name: "Test Player",
    color: "#3B82F6",
    timelineColor: "#60A5FA",
    score: 0,
    timeline: [],
    ...overrides
  };
}

/**
 * Creates a mock game room for testing
 */
export function createMockGameRoom(overrides: Partial<GameRoom> = {}): GameRoom {
  return {
    id: "test-room-1",
    lobby_code: "TEST1",
    host_id: "test-host-1",
    host_name: "Test Host",
    phase: "lobby",
    gamemode: "classic",
    gamemode_settings: {},
    songs: [createMockSong()],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  };
}

/**
 * Creates multiple mock songs for testing
 */
export function createMockSongs(count: number): Song[] {
  return Array.from({ length: count }, (_, index) => 
    createMockSong({
      id: `test-song-${index + 1}`,
      deezer_title: `Test Song ${index + 1}`,
      release_year: (1990 + index).toString()
    })
  );
}

/**
 * Creates multiple mock players for testing
 */
export function createMockPlayers(count: number): Player[] {
  const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];
  return Array.from({ length: count }, (_, index) => 
    createMockPlayer({
      id: `test-player-${index + 1}`,
      name: `Player ${index + 1}`,
      color: colors[index % colors.length]
    })
  );
}

/**
 * Simulates a delay for testing async operations
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Mock localStorage for testing
 */
export const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem: (key: string) => mockLocalStorage.store[key] || null,
  setItem: (key: string, value: string) => {
    mockLocalStorage.store[key] = value;
  },
  removeItem: (key: string) => {
    delete mockLocalStorage.store[key];
  },
  clear: () => {
    mockLocalStorage.store = {};
  }
};

/**
 * Mock audio element for testing
 */
export class MockAudio {
  src = "";
  currentTime = 0;
  duration = 30;
  paused = true;
  volume = 1;
  
  play = jest.fn(() => Promise.resolve());
  pause = jest.fn();
  load = jest.fn();
  
  addEventListener = jest.fn();
  removeEventListener = jest.fn();
}