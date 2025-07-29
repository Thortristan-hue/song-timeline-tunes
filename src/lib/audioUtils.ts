/**
 * Audio utility functions to handle audio playback errors gracefully
 * and ensure game logic never blocks due to audio issues
 */

export interface AudioErrorHandler {
  onError?: (error: Error) => void;
  onSuccess?: () => void;
  silentFallback?: boolean;
}

/**
 * Safely plays an audio element with comprehensive error handling
 * CRITICAL: Never blocks game logic - always handles errors gracefully
 */
export async function safeAudioPlay(
  audio: HTMLAudioElement, 
  options: AudioErrorHandler = {}
): Promise<boolean> {
  try {
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      // Handle promise-based audio.play()
      return playPromise
        .then(() => {
          console.log('✅ Audio playback started successfully');
          options.onSuccess?.();
          return true;
        })
        .catch(error => {
          handleAudioError(error, options);
          return false;
        });
    } else {
      // Handle non-promise audio.play() (older browsers)
      console.log('🎵 Audio play initiated (legacy mode)');
      options.onSuccess?.();
      return true;
    }
  } catch (error) {
    handleAudioError(error as Error, options);
    return false;
  }
}

/**
 * Handles audio errors with appropriate logging and fallback behavior
 */
function handleAudioError(error: Error, options: AudioErrorHandler): void {
  // Log specific error types for debugging
  if (error.name === 'NotAllowedError') {
    console.warn('🎵 Audio blocked by browser policy - game continues normally');
  } else if (error.name === 'NotSupportedError') {
    console.warn('🎵 Audio format not supported or MIME type issue - game continues normally');
  } else if (error.name === 'AbortError') {
    console.warn('🎵 Audio play aborted - likely due to source change - game continues normally');
  } else {
    console.warn('🎵 Audio error occurred - game continues normally:', error.message);
  }
  
  // Call custom error handler if provided
  options.onError?.(error);
}

/**
 * Creates an audio element with proper error handling setup
 */
export function createSafeAudioElement(src: string, volume: number = 0.8): HTMLAudioElement {
  const audio = new Audio(src);
  audio.crossOrigin = 'anonymous';
  audio.volume = Math.max(0, Math.min(1, volume)); // Clamp volume between 0 and 1
  audio.preload = 'metadata';
  
  // Add comprehensive error event listeners
  audio.addEventListener('error', (e) => {
    const target = e.target as HTMLAudioElement;
    const error = target.error;
    
    console.error('❌ Audio element error:', {
      code: error?.code,
      message: error?.message,
      src: target.src
    });
    
    // Log specific media error types
    if (error?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
      console.warn('🎵 Audio source not supported or MIME type issue');
    } else if (error?.code === MediaError.MEDIA_ERR_NETWORK) {
      console.warn('🎵 Audio network error');
    } else if (error?.code === MediaError.MEDIA_ERR_DECODE) {
      console.warn('🎵 Audio decode error');
    } else if (error?.code === MediaError.MEDIA_ERR_ABORTED) {
      console.warn('🎵 Audio loading aborted');
    }
  });
  
  audio.addEventListener('abort', () => {
    console.warn('🎵 Audio loading aborted - likely due to source change');
  });
  
  return audio;
}

/**
 * Utility to check if audio is supported and working
 */
export function isAudioSupported(): boolean {
  try {
    return !!(window.Audio && (window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext));
  } catch (error) {
    console.warn('🎵 Audio support check failed:', error);
    return false;
  }
}

/**
 * Checks if specific audio format is supported
 */
export function isAudioFormatSupported(mimeType: string): boolean {
  try {
    const audio = new Audio();
    const canPlay = audio.canPlayType(mimeType);
    return canPlay === 'probably' || canPlay === 'maybe';
  } catch (error) {
    console.warn(`🎵 Audio format support check failed for ${mimeType}:`, error);
    return false;
  }
}