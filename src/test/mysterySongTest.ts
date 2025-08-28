// Simple test to verify mystery song renewal logic
// This is a developer-only test script to validate song selection behavior

import { Song } from '@/types/game';

// Mock song data for testing
const createMockSong = (id: string, title: string, artist: string, year: string): Song => ({
  id,
  deezer_title: title,
  deezer_artist: artist,
  deezer_album: 'Test Album',
  release_year: year,
  genre: 'Test',
  cardColor: '#4CC9F0',
  preview_url: 'https://example.com/preview.mp3'
});

const mockSongs: Song[] = [
  createMockSong('1', 'Song 1', 'Artist 1', '1970'),
  createMockSong('2', 'Song 2', 'Artist 2', '1975'),
  createMockSong('3', 'Song 3', 'Artist 3', '1980'),
  createMockSong('4', 'Song 4', 'Artist 4', '1985'),
  createMockSong('5', 'Song 5', 'Artist 5', '1990'),
  createMockSong('6', 'Song 6', 'Artist 6', '1995'),
  createMockSong('7', 'Song 7', 'Artist 7', '2000'),
  createMockSong('8', 'Song 8', 'Artist 8', '2005'),
];

// Test the current random selection approach
export function testCurrentApproach() {
  console.log('🧪 Testing current random selection approach...');
  
  const usedSongs = new Set(['1', '2', '3']); // Simulate 3 songs already used
  const availableSongs = mockSongs.filter(s => !usedSongs.has(s.id));
  
  console.log(`Available songs: ${availableSongs.length}`);
  
  // Test for duplicates in multiple selections
  const selections: string[] = [];
  for (let i = 0; i < 10; i++) {
    const selected = availableSongs[Math.floor(Math.random() * availableSongs.length)];
    selections.push(selected.id);
  }
  
  const uniqueSelections = new Set(selections);
  console.log(`Selections: [${selections.join(', ')}]`);
  console.log(`Unique selections: ${uniqueSelections.size} / ${selections.length}`);
  
  if (uniqueSelections.size < selections.length) {
    console.log('❌ ISSUE: Random selection produced duplicates');
  } else {
    console.log('✅ No duplicates in this run (but not guaranteed)');
  }
}

// Test improved shuffle-based approach
export function testShuffleApproach() {
  console.log('\n🧪 Testing improved shuffle-based approach...');
  
  // Fisher-Yates shuffle implementation
  function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  const usedSongs = new Set(['1', '2', '3']); // Simulate 3 songs already used
  const availableSongs = mockSongs.filter(s => !usedSongs.has(s.id));
  const shuffledSongs = shuffleArray(availableSongs);
  
  console.log(`Available songs: ${availableSongs.length}`);
  console.log(`Shuffled order: [${shuffledSongs.map(s => s.id).join(', ')}]`);
  
  // Simulate sequential selection from shuffled deck
  const selections: string[] = [];
  for (let i = 0; i < Math.min(shuffledSongs.length, 5); i++) {
    selections.push(shuffledSongs[i].id);
  }
  
  console.log(`Sequential selections: [${selections.join(', ')}]`);
  console.log('✅ Guaranteed no duplicates with shuffle approach');
}

// Test end-of-game scenario
export function testEndOfGame() {
  console.log('\n🧪 Testing end-of-game scenario...');
  
  const totalSongs = mockSongs.length;
  const usedSongs = new Set(mockSongs.map(s => s.id)); // All songs used
  const availableSongs = mockSongs.filter(s => !usedSongs.has(s.id));
  
  console.log(`Total songs: ${totalSongs}`);
  console.log(`Used songs: ${usedSongs.size}`);
  console.log(`Available songs: ${availableSongs.length}`);
  
  if (availableSongs.length === 0) {
    console.log('✅ Properly detected end-of-game condition');
  } else {
    console.log('❌ Failed to detect end-of-game condition');
  }
}

// Run all tests
export function runMysteryCardTests() {
  console.log('🎵 Mystery Card Selection Tests\n' + '='.repeat(40));
  
  testCurrentApproach();
  testShuffleApproach();
  testEndOfGame();
  
  console.log('\n' + '='.repeat(40));
  console.log('🎯 Recommendations:');
  console.log('1. Replace random selection with shuffled deck');
  console.log('2. Implement proper end-of-game handling');
  console.log('3. Use sequential consumption from shuffled songs');
  console.log('4. Add proper state management for remaining songs');
}

// Export for console testing
if (typeof window !== 'undefined') {
  (window as any).mysterySongTests = {
    runMysteryCardTests,
    testCurrentApproach,
    testShuffleApproach,
    testEndOfGame
  };
}