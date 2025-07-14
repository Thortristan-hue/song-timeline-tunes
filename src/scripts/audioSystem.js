/**
 * Game Audio System
 * Manages all game sounds, background music, and voice prompts
 */
class AudioSystem {
  constructor() {
    this.sounds = {
      buttonClick: new Audio('assets/audio/click.mp3'),
      correct: new Audio('assets/audio/correct.mp3'),
      wrong: new Audio('assets/audio/wrong.mp3'),
      roundStart: new Audio('assets/audio/round-start.mp3'),
      gameOver: new Audio('assets/audio/game-over.mp3'),
      highScore: new Audio('assets/audio/high-score.mp3')
    };
    
    // Voice prompts
    this.voicePrompts = {
      welcome: [
        new Audio('assets/audio/voice/welcome1.mp3'),
        new Audio('assets/audio/voice/welcome2.mp3')
      ],
      correct: [
        new Audio('assets/audio/voice/correct1.mp3'),
        new Audio('assets/audio/voice/correct2.mp3')
      ],
      wrong: [
        new Audio('assets/audio/voice/wrong1.mp3'),
        new Audio('assets/audio/voice/wrong2.mp3')
      ],
      roundComplete: [
        new Audio('assets/audio/voice/round-complete1.mp3'),
        new Audio('assets/audio/voice/round-complete2.mp3')
      ]
    };
    
    // Background music
    this.backgroundMusic = new Audio('assets/audio/background-music.mp3');
    this.backgroundMusic.loop = true;
    this.backgroundMusic.volume = 0.3;
    
    // Current song being played in the game
    this.currentSong = null;
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // Listen for song playing events
    document.addEventListener('songPlaying', () => {
      if (this.currentSong) {
        this.currentSong.play();
      }
    });
    
    document.addEventListener('songPaused', () => {
      if (this.currentSong) {
        this.currentSong.pause();
      }
    });
    
    // Listen for game events
    document.addEventListener('correctAnswer', () => {
      this.playSound('correct');
      this.playRandomVoicePrompt('correct');
    });
    
    document.addEventListener('wrongAnswer', () => {
      this.playSound('wrong');
      this.playRandomVoicePrompt('wrong');
    });
    
    document.addEventListener('roundStart', () => {
      this.playSound('roundStart');
    });
    
    document.addEventListener('gameOver', () => {
      this.playSound('gameOver');
    });
    
    document.addEventListener('highScore', () => {
      this.playSound('highScore');
    });
    
    // UI interaction sounds
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('timeline-card') || 
          e.target.classList.contains('play-button') ||
          e.target.closest('button')) {
        this.playSound('buttonClick');
      }
    });
    
    // Handle initial game start
    document.addEventListener('gameStart', () => {
      this.backgroundMusic.play();
      this.playRandomVoicePrompt('welcome');
    });
  }
  
  playSound(soundName) {
    const sound = this.sounds[soundName];
    if (sound) {
      sound.currentTime = 0; // Reset to start
      sound.play().catch(error => {
        console.warn('Audio play failed:', error);
        // User might not have interacted with the page yet
      });
    }
  }
  
  playRandomVoicePrompt(promptType) {
    const prompts = this.voicePrompts[promptType];
    if (prompts && prompts.length > 0) {
      const randomIndex = Math.floor(Math.random() * prompts.length);
      prompts[randomIndex].play().catch(error => {
        console.warn('Voice prompt play failed:', error);
      });
    }
  }
  
  loadSong(songUrl) {
    // Stop current song if any
    if (this.currentSong) {
      this.currentSong.pause();
    }
    
    // Load the new song
    this.currentSong = new Audio(songUrl);
    this.currentSong.volume = 0.7;
    
    // Return a promise that resolves when the song is loaded
    return new Promise((resolve, reject) => {
      this.currentSong.addEventListener('canplaythrough', () => {
        resolve();
      });
      
      this.currentSong.addEventListener('error', () => {
        reject('Failed to load song');
      });
    });
  }
  
  fadeOutBackgroundMusic() {
    const fadeOut = setInterval(() => {
      if (this.backgroundMusic.volume > 0.05) {
        this.backgroundMusic.volume -= 0.05;
      } else {
        this.backgroundMusic.pause();
        this.backgroundMusic.volume = 0.3; // Reset volume for next time
        clearInterval(fadeOut);
      }
    }, 100);
  }
  
  // Add your own custom voice lines
  addCustomVoiceLine(promptType, audioPath) {
    if (!this.voicePrompts[promptType]) {
      this.voicePrompts[promptType] = [];
    }
    
    const newAudio = new Audio(audioPath);
    this.voicePrompts[promptType].push(newAudio);
  }
}

// Initialize audio system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.audioSystem = new AudioSystem();
});
