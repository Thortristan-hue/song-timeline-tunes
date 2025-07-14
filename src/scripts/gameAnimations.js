/**
 * Game Animation System
 * Provides smooth, professional animations for game elements
 */
class GameAnimations {
  constructor() {
    // Initialize GSAP timeline
    this.mainTimeline = gsap.timeline();
    
    // Setup initial animations
    this.setupIntroAnimations();
    
    // Setup event listeners for game interactions
    this.setupEventListeners();
  }
  
  setupIntroAnimations() {
    // Reset any previous animations
    this.mainTimeline.clear();
    
    // Fade in game title
    this.mainTimeline.from('.game-logo', {
      y: -50,
      opacity: 0,
      duration: 0.8,
      ease: 'back.out(1.7)'
    });
    
    // Animate stat boxes
    this.mainTimeline.from('.stat-box', {
      x: 30,
      opacity: 0,
      stagger: 0.2,
      duration: 0.5,
      ease: 'power2.out'
    }, '-=0.4');
    
    // Vinyl record entrance
    this.mainTimeline.from('.vinyl-container', {
      scale: 0,
      rotation: -180,
      opacity: 0,
      duration: 1,
      ease: 'elastic.out(1, 0.3)'
    }, '-=0.2');
    
    // Mystery song text reveal
    this.mainTimeline.from('.mystery-song-text', {
      y: 20,
      opacity: 0,
      duration: 0.5,
      ease: 'power2.out'
    }, '-=0.3');
    
    // Timeline cards entrance
    this.mainTimeline.from('.timeline-card', {
      y: 50,
      opacity: 0,
      stagger: 0.15,
      duration: 0.7,
      ease: 'back.out(1.7)'
    }, '-=0.2');
  }
  
  setupEventListeners() {
    // Vinyl record spinning animation
    const vinylRecord = document.querySelector('.vinyl-record');
    const playButton = document.querySelector('.play-button');
    
    if (playButton && vinylRecord) {
      playButton.addEventListener('click', () => {
        this.togglePlayingState();
      });
    }
    
    // Timeline card animations
    const timelineCards = document.querySelectorAll('.timeline-card');
    timelineCards.forEach(card => {
      card.addEventListener('click', () => {
        this.selectTimelineCard(card);
      });
    });
  }
  
  togglePlayingState() {
    const vinylRecord = document.querySelector('.vinyl-record');
    const playButton = document.querySelector('.play-button');
    
    if (vinylRecord.classList.contains('playing')) {
      // Stop playing
      gsap.to(vinylRecord, {
        rotation: '+=30',
        duration: 0.5,
        ease: 'power1.out'
      });
      vinylRecord.classList.remove('playing');
      playButton.style.opacity = 1;
      
      // Stop the continuous spinning
      gsap.killTweensOf(vinylRecord, {rotation: true});
      
      // Dispatch event for audio system to handle
      document.dispatchEvent(new CustomEvent('songPaused'));
      
    } else {
      // Start playing
      playButton.style.opacity = 0;
      vinylRecord.classList.add('playing');
      
      // Initial quick spin
      gsap.to(vinylRecord, {
        rotation: '+=30',
        duration: 0.2,
        ease: 'power1.in',
        onComplete: () => {
          // Continuous spinning
          gsap.to(vinylRecord, {
            rotation: '+=360',
            duration: 2,
            ease: 'none',
            repeat: -1
          });
        }
      });
      
      // Create audio wave effect
      this.createAudioWaves();
      
      // Dispatch event for audio system to handle
      document.dispatchEvent(new CustomEvent('songPlaying'));
    }
  }
  
  createAudioWaves() {
    const vinylContainer = document.querySelector('.vinyl-container');
    
    if (!vinylContainer) return;
    
    for (let i = 0; i < 3; i++) {
      const wave = document.createElement('div');
      wave.className = 'audio-wave';
      vinylContainer.appendChild(wave);
      
      gsap.fromTo(wave, 
        { scale: 1, opacity: 0.7, borderRadius: '50%' },
        { 
          scale: 2 + i*0.5, 
          opacity: 0, 
          duration: 1.5 + i*0.3,
          ease: 'power1.out',
          onComplete: () => wave.remove()
        }
      );
    }
    
    // If record is still playing, create more waves
    if (document.querySelector('.vinyl-record').classList.contains('playing')) {
      setTimeout(() => this.createAudioWaves(), 2000);
    }
  }
  
  selectTimelineCard(card) {
    const allCards = document.querySelectorAll('.timeline-card');
    
    // Reset all cards
    allCards.forEach(c => {
      gsap.to(c, {
        scale: 1,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        borderColor: 'transparent',
        duration: 0.3
      });
    });
    
    // Highlight selected card
    gsap.to(card, {
      scale: 1.05,
      boxShadow: '0 15px 50px rgba(255, 58, 94, 0.7)',
      border: '2px solid var(--primary-color)',
      duration: 0.5,
      ease: 'back.out(1.7)'
    });
    
    // Add pulse effect
    this.pulseEffect(card);
    
    // Dispatch selected event with card data
    const year = card.querySelector('.card-year').textContent;
    document.dispatchEvent(new CustomEvent('timelineCardSelected', { 
      detail: { year: year }
    }));
  }
  
  pulseEffect(element) {
    gsap.to(element, {
      boxShadow: '0 0 30px rgba(255, 58, 94, 0.9)',
      duration: 0.5,
      yoyo: true,
      repeat: 3,
      ease: 'sine.inOut'
    });
  }
  
  showCorrectAnswer(yearElement) {
    const card = yearElement.closest('.timeline-card');
    
    // Create confetti effect
    this.createConfetti();
    
    // Animate the correct card
    gsap.timeline()
      .to(card, {
        scale: 1.1,
        boxShadow: '0 15px 50px rgba(58, 255, 94, 0.7)',
        border: '2px solid #3aff5e',
        duration: 0.5,
        ease: 'back.out(1.7)'
      })
      .to(card, {
        rotation: [0, -5, 5, -5, 0],
        duration: 0.6,
        ease: 'power1.inOut'
      }, '-=0.3')
      .to(yearElement, {
        scale: 1.2,
        color: '#3aff5e',
        textShadow: '0 0 10px rgba(58, 255, 94, 0.7)',
        duration: 0.5,
        ease: 'back.out(1.7)'
      }, '-=0.6');
  }
  
  showWrongAnswer(yearElement) {
    const card = yearElement.closest('.timeline-card');
    
    // Animate the wrong card
    gsap.timeline()
      .to(card, {
        scale: 1.05,
        boxShadow: '0 15px 50px rgba(255, 58, 94, 0.7)',
        border: '2px solid #ff3a5e',
        duration: 0.5,
        ease: 'back.out(1.7)'
      })
      .to(card, {
        x: [0, -10, 10, -10, 10, 0],
        duration: 0.5,
        ease: 'power1.inOut'
      }, '-=0.3')
      .to(yearElement, {
        color: '#ff3a5e',
        textShadow: '0 0 10px rgba(255, 58, 94, 0.7)',
        duration: 0.5
      }, '-=0.5');
  }
  
  createConfetti() {
    const colors = ['#ff3a5e', '#3affda', '#ffc045', '#4f8eff', '#f845ff'];
    const containerRect = document.querySelector('.game-container').getBoundingClientRect();
    
    for (let i = 0; i < 100; i++) {
      const confetti = document.createElement('div');
      confetti.style.position = 'fixed';
      confetti.style.width = (Math.random() * 10 + 5) + 'px';
      confetti.style.height = (Math.random() * 10 + 5) + 'px';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
      confetti.style.zIndex = '9999';
      
      // Position confetti at the center of the container
      confetti.style.left = (containerRect.left + containerRect.width / 2) + 'px';
      confetti.style.top = (containerRect.top + containerRect.height / 2) + 'px';
      
      document.body.appendChild(confetti);
      
      // Animate each confetti
      gsap.to(confetti, {
        x: (Math.random() - 0.5) * containerRect.width * 1.5,
        y: -Math.random() * containerRect.height,
        rotation: Math.random() * 720 - 360,
        duration: Math.random() * 3 + 2,
        ease: 'power1.out',
        onComplete: () => confetti.remove()
      });
    }
  }
  
  updateScoreAnimation(newScore) {
    const scoreValue = document.querySelector('.score-value');
    if (!scoreValue) return;
    
    // Animate score change
    gsap.timeline()
      .to(scoreValue, {
        scale: 1.5,
        color: '#3aff5e',
        duration: 0.3,
        ease: 'back.out(1.7)'
      })
      .to(scoreValue, {
        scale: 1,
        color: 'var(--light-text)',
        duration: 0.3,
        ease: 'power2.out'
      });
    
    // Update the score text
    scoreValue.textContent = newScore;
  }
  
  roundTransition() {
    // Create a full screen overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'black';
    overlay.style.zIndex = '9999';
    overlay.style.opacity = '0';
    
    document.body.appendChild(overlay);
    
    // Fade in and out transition
    gsap.timeline()
      .to(overlay, {
        opacity: 1,
        duration: 0.5,
        ease: 'power2.inOut'
      })
      .to(overlay, {
        opacity: 0,
        duration: 0.5,
        delay: 0.3,
        ease: 'power2.inOut',
        onComplete: () => {
          overlay.remove();
          this.setupIntroAnimations(); // Reset animations for new round
          
          // Dispatch event that transition is complete
          document.dispatchEvent(new CustomEvent('roundTransitionComplete'));
        }
      });
  }
}

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.gameAnimations = new GameAnimations();
});
