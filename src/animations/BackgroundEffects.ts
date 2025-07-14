import { gsap } from 'gsap';

export class BackgroundEffects {
  private graffitiBg: HTMLElement;
  private vinylRecord: HTMLElement;
  
  constructor() {
    this.graffitiBg = document.getElementById('background') as HTMLElement;
    this.vinylRecord = document.getElementById('vinyl-record') as HTMLElement;
    this.initAnimations();
  }
  
  initAnimations() {
    // Subtle background pulse
    gsap.to(this.graffitiBg, {
      backgroundSize: '102%',
      duration: 5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
    
    // Vinyl record rotation
    gsap.to(this.vinylRecord, {
      rotation: 360,
      duration: 8,
      repeat: -1,
      ease: 'none'
    });
    
    // Timeline cards hover effects
    const timelineCards = document.querySelectorAll('.timeline-card');
    timelineCards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        gsap.to(card, {
          scale: 1.05,
          boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
          duration: 0.3
        });
      });
      
      card.addEventListener('mouseleave', () => {
        gsap.to(card, {
          scale: 1,
          boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
          duration: 0.3
        });
      });
    });
  }
  
  // Add visual effect when song is playing
  playSongEffect() {
    gsap.fromTo(this.vinylRecord, 
      { scale: 0.9, opacity: 0.8 },
      { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out' }
    );
    
    // Create audio wave effect around vinyl
    this.createAudioWaves();
  }
  
  createAudioWaves() {
    for (let i = 0; i < 3; i++) {
      const wave = document.createElement('div');
      wave.className = 'audio-wave';
      this.vinylRecord.parentElement?.appendChild(wave);
      
      gsap.fromTo(wave, 
        { scale: 1, opacity: 0.7, borderRadius: '50%' },
        { 
          scale: 2 + i*0.5, 
          opacity: 0, 
          duration: 1.5 + i*0.3,
          onComplete: () => wave.remove()
        }
      );
    }
  }
}

export default BackgroundEffects;
