/**
 * Simple test to verify audio utilities work correctly
 * This file can be run in the browser console to test audio handling
 */

import { safeAudioPlay, createSafeAudioElement, isAudioSupported, isAudioFormatSupported } from './audioUtils';

// Test audio support detection
console.log('🧪 Testing audio support detection...');
console.log('Audio supported:', isAudioSupported());
console.log('MP3 supported:', isAudioFormatSupported('audio/mpeg'));
console.log('WAV supported:', isAudioFormatSupported('audio/wav'));
console.log('OGG supported:', isAudioFormatSupported('audio/ogg'));

// Test safe audio creation and play
export async function testAudioPlayback() {
  console.log('🧪 Testing safe audio playback...');
  
  // Test with a valid audio file (assuming it exists)
  const validAudio = createSafeAudioElement('/sounds/button-click.mp3', 0.5);
  const validResult = await safeAudioPlay(validAudio, {
    onSuccess: () => console.log('✅ Valid audio test successful'),
    onError: (error) => console.log('❌ Valid audio test failed:', error.message)
  });
  console.log('Valid audio result:', validResult);
  
  // Test with an invalid audio file
  const invalidAudio = createSafeAudioElement('/sounds/nonexistent.mp3', 0.5);
  const invalidResult = await safeAudioPlay(invalidAudio, {
    onSuccess: () => console.log('✅ This should not happen for invalid audio'),
    onError: (error) => console.log('✅ Invalid audio handled correctly:', error.message)
  });
  console.log('Invalid audio result:', invalidResult);
  
  console.log('🧪 Audio tests completed');
}

// Test can be run manually: testAudioPlayback();