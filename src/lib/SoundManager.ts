
export default class SoundManager {
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, HTMLAudioElement> = new Map();

  constructor() {
    // Initialize audio context if available
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      this.audioContext = new AudioContext();
    }
  }

  playSound(soundName: string): void {
    try {
      const soundPath = `/sounds/${soundName}.mp3`;
      
      // Check if sound is already loaded
      if (this.sounds.has(soundName)) {
        const audio = this.sounds.get(soundName)!;
        audio.currentTime = 0;
        audio.play().catch(() => {
          // Silently fail if audio can't play
        });
        return;
      }

      // Load and play new sound
      const audio = new Audio(soundPath);
      audio.volume = 0.3;
      this.sounds.set(soundName, audio);
      audio.play().catch(() => {
        // Silently fail if audio can't play
      });
    } catch (error) {
      // Silently fail if there's an error
      console.warn(`Could not play sound: ${soundName}`);
    }
  }

  stopAllSounds(): void {
    this.sounds.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  }
}
