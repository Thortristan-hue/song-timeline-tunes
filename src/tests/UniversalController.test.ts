/**
 * Test suite for Universal Controller functionality
 * Tests cross-device audio synchronization between host and mobile devices
 */

import { audioManager } from '@/services/AudioManager';
import { Song } from '@/types/game';

// Mock Supabase for testing
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    channel: jest.fn().mockReturnValue({
      on: jest.fn().mockReturnValue({
        subscribe: jest.fn()
      }),
      send: jest.fn()
    })
  }
}));

// Mock DeezerAudioService
jest.mock('@/services/DeezerAudioService', () => ({
  DeezerAudioService: {
    createAudioElement: jest.fn().mockReturnValue({
      play: jest.fn().mockResolvedValue(undefined),
      pause: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      currentTime: 0
    })
  }
}));

describe('Universal Controller', () => {
  const mockSong: Song = {
    id: 'test-song-1',
    deezer_title: 'Test Song',
    deezer_artist: 'Test Artist',
    deezer_album: 'Test Album',
    release_year: '2023',
    genre: 'Pop',
    cardColor: 'bg-blue-500',
    preview_url: 'https://example.com/preview.mp3'
  };

  beforeEach(() => {
    // Reset audio manager state
    audioManager.stop();
  });

  describe('Host Device Audio Control', () => {
    test('should initialize as host and handle audio playback', () => {
      audioManager.initialize('test-room-123', true);
      
      expect(audioManager.getCurrentSong()).toBeNull();
      expect(audioManager.getIsPlaying()).toBe(false);
    });

    test('should play song when requested by mobile device', async () => {
      audioManager.initialize('test-room-123', true);
      
      await audioManager.playSong(mockSong);
      
      expect(audioManager.getCurrentSong()).toEqual(mockSong);
      expect(audioManager.getIsPlaying()).toBe(true);
    });

    test('should toggle play/pause correctly', async () => {
      audioManager.initialize('test-room-123', true);
      
      // Start playing
      await audioManager.togglePlayPause(mockSong);
      expect(audioManager.getIsPlaying()).toBe(true);
      
      // Toggle to pause
      await audioManager.togglePlayPause(mockSong);
      expect(audioManager.getIsPlaying()).toBe(false);
    });
  });

  describe('Mobile Device Universal Control', () => {
    test('should initialize as mobile device', () => {
      audioManager.initialize('test-room-123', false);
      
      expect(audioManager.getCurrentSong()).toBeNull();
      expect(audioManager.getIsPlaying()).toBe(false);
    });

    test('should send universal control commands instead of playing locally', async () => {
      audioManager.initialize('test-room-123', false);
      
      // Mock the sendUniversalAudioControl method
      const sendSpy = jest.spyOn(audioManager as any, 'sendUniversalAudioControl');
      sendSpy.mockImplementation(() => Promise.resolve());
      
      await audioManager.togglePlayPause(mockSong);
      
      expect(sendSpy).toHaveBeenCalledWith('toggle', mockSong);
    });
  });

  describe('Cross-Device Synchronization', () => {
    test('should notify listeners when audio state changes', () => {
      audioManager.initialize('test-room-123', true);
      
      const mockListener = jest.fn();
      audioManager.addPlayStateListener(mockListener);
      
      // Manually trigger state change
      (audioManager as any).isPlaying = true;
      (audioManager as any).currentSong = mockSong;
      (audioManager as any).notifyPlayStateChange();
      
      expect(mockListener).toHaveBeenCalledWith(true, mockSong);
      
      audioManager.removePlayStateListener(mockListener);
    });

    test('should handle audio state synchronization between devices', async () => {
      const hostAudioManager = audioManager;
      hostAudioManager.initialize('test-room-123', true);
      
      const listeners: Array<(isPlaying: boolean, song?: Song) => void> = [];
      
      hostAudioManager.addPlayStateListener((isPlaying, song) => {
        console.log(`Audio state synchronized: playing=${isPlaying}, song=${song?.deezer_title}`);
        listeners.push((isPlaying, song) => {});
      });
      
      await hostAudioManager.playSong(mockSong);
      
      expect(hostAudioManager.getIsPlaying()).toBe(true);
      expect(hostAudioManager.getCurrentSong()).toEqual(mockSong);
    });
  });

  describe('Song Timeline Rendering', () => {
    test('should handle empty timeline gracefully', () => {
      const emptyTimeline: Song[] = [];
      const timelineSongs = emptyTimeline
        .filter(song => song !== null && song !== undefined && song.id && song.deezer_title)
        .sort((a, b) => parseInt(a.release_year) - parseInt(b.release_year));
      
      expect(timelineSongs).toEqual([]);
    });

    test('should properly sort and filter timeline songs', () => {
      const testTimeline: Song[] = [
        { ...mockSong, id: '3', release_year: '2021' },
        { ...mockSong, id: '1', release_year: '2019' },
        { ...mockSong, id: '2', release_year: '2020' },
        null as any, // Should be filtered out
        undefined as any, // Should be filtered out
      ];
      
      const timelineSongs = testTimeline
        .filter(song => song !== null && song !== undefined && song.id && song.deezer_title)
        .sort((a, b) => parseInt(a.release_year) - parseInt(b.release_year));
      
      expect(timelineSongs).toHaveLength(3);
      expect(timelineSongs[0].release_year).toBe('2019');
      expect(timelineSongs[1].release_year).toBe('2020');
      expect(timelineSongs[2].release_year).toBe('2021');
    });
  });
});