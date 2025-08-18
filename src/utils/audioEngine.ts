import { Howl } from 'howler';
import { suppressUnused } from './suppressUnused';

class AudioEngine {
  private sounds: { [key: string]: Howl } = {};

  loadAudio(id: string, src: string): void {
    if (this.sounds[id]) {
      console.warn(`Audio with id "${id}" already loaded. Overwriting.`);
    }

    this.sounds[id] = new Howl({
      src: [src],
      preload: true,
      onload: () => {
        console.log(`Audio "${id}" loaded successfully.`);
      },
      onloaderror: () => {
        console.error(`Failed to load audio "${id}" from ${src}.`);
      }
    });
  }

  playAudio(id: string, src: string, loop = false): void {
    suppressUnused(id);
    if (!this.sounds[id]) {
      this.loadAudio(id, src);
    }

    this.sounds[id].loop(loop);
    this.sounds[id].play();
  }

  pauseAudio(id: string): void {
    if (this.sounds[id]) {
      this.sounds[id].pause();
    } else {
      console.warn(`Audio with id "${id}" not found. Cannot pause.`);
    }
  }

  stopAudio(id: string): void {
    if (this.sounds[id]) {
      this.sounds[id].stop();
    } else {
      console.warn(`Audio with id "${id}" not found. Cannot stop.`);
    }
  }

  setVolume(id: string, volume: number): void {
    if (this.sounds[id]) {
      this.sounds[id].volume(volume);
    } else {
      console.warn(`Audio with id "${id}" not found. Cannot set volume.`);
    }
  }

  fadeVolume(id: string, from: number, to: number, duration: number): void {
    if (this.sounds[id]) {
      this.sounds[id].fade(from, to, duration);
    } else {
      console.warn(`Audio with id "${id}" not found. Cannot fade volume.`);
    }
  }

  isPlaying(id: string): boolean {
    if (this.sounds[id]) {
      return this.sounds[id].playing();
    }
    return false;
  }

  unloadAudio(id: string): void {
    if (this.sounds[id]) {
      this.sounds[id].unload();
      delete this.sounds[id];
      console.log(`Audio "${id}" unloaded.`);
    } else {
      console.warn(`Audio with id "${id}" not found. Cannot unload.`);
    }
  }

  stopAll(id?: string): void {
    suppressUnused(id);
    Object.values(this.sounds).forEach(sound => {
      sound.stop();
    });
  }
}

export const audioEngine = new AudioEngine();
