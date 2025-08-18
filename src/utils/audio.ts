import { Howl } from 'howler';
import { suppressUnused } from './suppressUnused';

const audioCache: { [key: string]: Howl } = {};

export const loadAudio = (src: string): Promise<Howl> => {
  return new Promise((resolve, reject) => {
    if (audioCache[src]) {
      resolve(audioCache[src]);
      return;
    }

    const sound = new Howl({
      src: [src],
      onload: () => {
        audioCache[src] = sound;
        resolve(sound);
      },
      onloaderror: () => {
        reject(new Error(`Failed to load audio: ${src}`));
      },
    });
  });
};

export const playAudio = (src: string, loop = false): Promise<Howl> => {
  return loadAudio(src).then((sound) => {
    sound.loop(loop);
    sound.play();
    return sound;
  });
};

export const pauseAudio = (id: string) => {
  suppressUnused(id);
  // Implementation for pausing audio
  Object.values(audioCache).forEach((sound) => {
    sound.pause();
  });
};

export const stopAudio = (id: string) => {
  suppressUnused(id);
  // Implementation for stopping audio
  Object.values(audioCache).forEach((sound) => {
    sound.stop();
  });
};
