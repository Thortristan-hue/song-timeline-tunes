/**
 * Song Timeline Game Logic
 * Core game mechanics and state management
 */
class GameLogic {
  constructor() {
    // Game state
    this.state = {
      currentRound: 1,
      totalRounds: 10,
      score: 0,
      highScore: this.loadHighScore(),
      currentSong: null,
      timeline: [],
      answered: false,
      gameStarted: false,
      gameOver: false
    };
    
    // Song database - this would ideally be loaded from an API or JSON file
    this.songDatabase = [
      { year: 1985, artist: "The Outfield", title: "Your Love", url: "assets/audio/songs/your-love.mp3" },
      { year: 2014, artist: "Tove Lo", title: "Habits (Stay High)", url: "assets/audio/songs/habits.mp3" },
      { year: 2019, artist: "Mabel", title: "Don't Call Me Up", url: "assets/audio/songs/dont-call-me-up.mp3" },
      { year: 2022, artist: "5MIINUST", title: "vamos", url: "assets/audio/songs/vamos.mp3" },
      { year: 2024, artist: "triibupasta", title: "trampolino", url: "assets/audio/songs/trampolino.mp3" },
      // Add more songs here
    ];
    
    // Store references to DOM elements
    this.domElements = {
      scoreValue: document.querySelector('.score-value'),
      roundValue: document.querySelector('.round-value'),
      mysterySongText: document.querySelector('.mystery-song-text'),
      timelineContainer: document.querySelector('.timeline-container'),
      playButton: document.querySelector('.play-button')
    };
    
    // Initialize
    this.init();
  }
  
  init() {
    // Set up event listeners
    this.setupEventListeners();
    
    // Update UI with initial state
    this.updateUI();
    
    // Wait for user to start the game
    this.showStartScreen();
  }
  
  setupEventListeners() {
    // Listen for timeline card selection
    document.addEventListener('timelineCardSelected', (event) => {
      if (this.state.answered) return; // Prevent multiple answers
      
      const selectedYear = parseInt(event.detail.year);
      this.checkAnswer(selectedYear);
    });
    
    // Listen for round transition completion
    document.addEventListener('roundTransitionComplete', () => {
      this.startNewRound();
    });
    
    // Start button click
    document.addEventListener('click', (e) => {
      if (e.target.id === 'start-game-btn') {
        this.startGame();
      } else if (e.target.id === 'restart-game-btn') {
        this.restartGame();
      }
    });
  }
  
  startGame() {
    // Hide start screen
    const startScreen = document.getElementById('start-screen');
    if (startScreen) {
      startScreen.style.display = 'none';
    }
    
    // Set game state
    this.state.gameStarted = true;
    
    // Trigger game start event
    document.dispatchEvent(new CustomEvent('gameStart'));
    
    // Start first round
    this.startNewRound();
  }
  
  startNewRound() {
    // Check if game is over
    if (this.state.currentRound > this.state.totalRounds) {
      this.endGame();
      return;
    }
    
    // Reset round state
    this.state.answered = false;
    
    // Generate timeline for this round
    this.generateTimeline();
    
    // Select mystery song
    this.selectMysterySong();
    
    // Update UI
    this.updateUI();
    
    // Trigger round start event
    document.dispatchEvent(new CustomEvent('roundStart'));
  }
  
  generateTimeline() {
    // Get 5 random songs for the timeline
    const shuffled = [...this.songDatabase].sort(() => 0.5 - Math.random());
    this.state.timeline = shuffled.slice(0, 5);
    
    // Sort timeline by year
    this.state.timeline.sort((a, b) => a.year - b.year);
  }
  
  selectMysterySong() {
    // Select a random song from the timeline
    const randomIndex = Math.floor(Math.random() * this.state.timeline.length);
    this.state.currentSong = this.state.timeline[randomIndex];
    
    // Load the song audio
    if (window.audioSystem) {
      window.audioSystem.loadSong(this.state.currentSong.url);
    }
  }
  
  updateUI() {
    // Update score and round display
    if (this.domElements.scoreValue) {
      this.domElements.scoreValue.textContent = this.state.score;
    }
    
    if (this.domElements.roundValue) {
      this.domElements.roundValue.textContent = `${this.state.currentRound}/${this.state.totalRounds}`;
    }
    
    // Update mystery song text
    if (this.domElements.mysterySongText) {
      this.domElements.mysterySongText.textContent = 'Mystery Song Playing';
    }
    
    // Build timeline cards
    this.buildTimelineUI();
  }
  
  buildTimelineUI() {
    if (!this.domElements.timelineContainer) return;
    
    // Clear previous timeline
    this.domElements.timelineContainer.innerHTML = '';
    
    // Add timeline track
    const track = document.createElement('div');
    track.className = 'timeline-track';
    this.domElements.timelineContainer.appendChild(track);
    
    // Add timeline cards
    this.state.timeline.forEach(song => {
      const card = document.createElement('div');
      card.className = 'timeline-card';
      card.innerHTML = `
        <div class="card-year">${song.year}</div>
        <div class="card-artist">${song.artist}</div>
        <div class="card-song">${song.title}</div>
        <div class="timeline-marker"></div>
      `;
      
      this.domElements.timelineContainer.appendChild(card);
    });
  }
  
  checkAnswer(selectedYear) {
    this.state.answered = true;
    
    // Check if the selected year matches the mystery song year
    const isCorrect = selectedYear === this.state.currentSong.year;
    
    // Find the year element that matches the mystery song
    const correctYearElement = document.querySelector(`.card-year:contains('${this.state.currentSong.year}')`);
    
    // Find the selected year element
    const selectedYearElement = document.querySelector(`.card-year:contains('${selectedYear}')`);
    
    if (isCorrect) {
      // Correct answer
      this.state.score += 100;
      
      // Trigger correct answer animations
      if (window.gameAnimations && correctYearElement) {
        window.gameAnimations.showCorrectAnswer(correctYearElement);
        window.gameAnimations.updateScoreAnimation(this.state.score);
      }
      
      // Play correct sound
      document.dispatchEvent(new CustomEvent('correctAnswer'));
      
      // Reveal song info
      this.revealSongInfo();
      
    } else {
      // Wrong answer
      // Trigger wrong answer animations
      if (window.gameAnimations) {
        if (selectedYearElement) {
          window.gameAnimations.showWrongAnswer(selectedYearElement);
        }
        if (correctYearElement) {
          setTimeout(() => {
            window.gameAnimations.showCorrectAnswer(correctYearElement);
          }, 1000);
        }
      }
      
      // Play wrong sound
      document.dispatchEvent(new CustomEvent('wrongAnswer'));
      
      // Reveal song info
      this.revealSongInfo();
    }
    
    // Wait before moving to next round
    setTimeout(() => {
      this.state.currentRound++;
      
      // Check if high score should be updated
      if (this.state.score > this.state.highScore) {
        this.state.highScore = this.state.score;
        this.saveHighScore(this.state.highScore);
        document.dispatchEvent(new CustomEvent('highScore'));
      }
      
      // Transition to next round
      if (window.gameAnimations) {
        window.gameAnimations.roundTransition();
      } else {
        this.startNewRound();
      }
    }, 3000);
  }
  
  revealSongInfo() {
    if (this.domElements.mysterySongText) {
      this.domElements.mysterySongText.textContent = 
        `${this.state.currentSong.artist} - ${this.state.currentSong.title} (${this.state.currentSong.year})`;
    }
  }
  
  endGame() {
    this.state.gameOver = true;
    
    // Trigger game over event
    document.dispatchEvent(new CustomEvent('gameOver'));
    
    // Show game over screen
    this.showGameOverScreen();
  }
  
  showStartScreen() {
    // Create start screen
    const startScreen = document.createElement('div');
    startScreen.id = 'start-screen';
    startScreen.className = 'game-overlay';
    
    startScreen.innerHTML = `
      <div class="overlay-content">
        <h1>Song Timeline Tunes</h1>
        <p>Listen to mystery songs and place them correctly on the timeline!</p>
        <button id="start-game-btn" class="game-button">Start Game</button>
      </div>
    `;
    
    document.body.appendChild(startScreen);
  }
  
  showGameOverScreen() {
    // Create game over screen
    const gameOverScreen = document.createElement('div');
    gameOverScreen.id = 'game-over-screen';
    gameOverScreen.className = 'game-overlay';
    
    gameOverScreen.innerHTML = `
      <div class="overlay-content">
        <h1>Game Over</h1>
        <p>Your score: ${this.state.score}</p>
        <p>High score: ${this.state.highScore}</p>
        <button id="restart-game-btn" class="game-button">Play Again</button>
      </div>
    `;
    
    document.body.appendChild(gameOverScreen);
  }
  
  restartGame() {
    // Hide game over screen
    const gameOverScreen = document.getElementById('game-over-screen');
    if (gameOverScreen) {
      gameOverScreen.remove();
    }
    
    // Reset game state
    this.state.currentRound = 1;
    this.state.score = 0;
    this.state.answered = false;
    this.state.gameOver = false;
    
    // Start first round
    this.startNewRound();
  }
  
  loadHighScore() {
    const highScore = localStorage.getItem('songTimelineHighScore');
    return highScore ? parseInt(highScore) : 0;
  }
  
  saveHighScore(score) {
    localStorage.setItem('songTimelineHighScore', score);
  }
}

// Add a contains selector for older browsers
if (!Element.prototype.matches) {
  Element.prototype.matches = Element.prototype.msMatchesSelector || 
                              Element.prototype.webkitMatchesSelector;
}

if (!Element.prototype.closest) {
  Element.prototype.closest = function(s) {
    var el = this;
    do {
      if (el.matches(s)) return el;
      el = el.parentElement || el.parentNode;
    } while (el !== null && el.nodeType === 1);
    return null;
  };
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.gameLogic = new GameLogic();
});
