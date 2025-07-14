import BackgroundEffects from './animations/BackgroundEffects';
import { GameHost } from './host/GameHost';

export class GameImmersion {
  private backgroundEffects: BackgroundEffects;
  private gameHost: GameHost;
  private soundEffects: Map<string, HTMLAudioElement> = new Map();
  
  constructor() {
    // Initialize background effects
    this.backgroundEffects = new BackgroundEffects();
    
    // Initialize game host
    this.gameHost = new GameHost();
    
    // Load sound effects
    this.loadSoundEffects();
    
    // Add event listeners
    this.setupEventListeners();
  }
  
  private loadSoundEffects() {
    // UI sounds
    this.soundEffects.set('hover', new Audio('assets/audio/hover.mp3'));
    this.soundEffects.set('select', new Audio('assets/audio/select.mp3'));
    this.soundEffects.set('correct', new Audio('assets/audio/correct.mp3'));
    this.soundEffects.set('wrong', new Audio('assets/audio/wrong.mp3'));
    this.soundEffects.set('round-start', new Audio('assets/audio/round-start.mp3'));
    this.soundEffects.set('game-start', new Audio('assets/audio/game-start.mp3'));
    
    // Set volume for all effects
    this.soundEffects.forEach(audio => audio.volume = 0.5);
  }
  
  private setupEventListeners() {
    // Example: Start new round
    document.addEventListener('newRound', () => {
      this.playSound('round-start');
      this.gameHost.speak('newRound');
      this.backgroundEffects.playSongEffect();
    });
    
    // Example: Correct answer
    document.addEventListener('correctAnswer', () => {
      this.playSound('correct');
      this.gameHost.speak('correctAnswer');
      // Add confetti or other visual celebration
      this.showConfetti();
    });
    
    // Example: Game start
    document.addEventListener('gameStart', () => {
      this.playSound('game-start');
      this.gameHost.speak('gameStart');
    });
    
    // Add hover sound to timeline cards
    const timelineCards = document.querySelectorAll('.timeline-card');
    timelineCards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        this.playSound('hover');
      });
      
      card.addEventListener('click', () => {
        this.playSound('select');
      });
    });
  }
  
  private playSound(soundName: string) {
    const sound = this.soundEffects.get(soundName);
    if (sound) {
      sound.currentTime = 0;
      sound.play();
    }
  }
  
  private showConfetti() {
    // Create confetti effect
    const confettiCount = 100;
    const colors = ['#ff0000', '#ffff00', '#00ff00', '#0000ff', '#ff00ff'];
    
    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.left = Math.random() * 100 + '%';
      
      document.body.appendChild(confetti);
      
      // Animate with GSAP
      gsap.to(confetti, {
        y: window.innerHeight,
        rotation: Math.random() * 360,
        duration: 3 + Math.random() * 2,
        ease: 'power1.out',
        onComplete: () => confetti.remove()
      });
    }
  }
}

// Initialize immersion features when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new GameImmersion();
});

export default GameImmersion;
