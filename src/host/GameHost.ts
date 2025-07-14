export interface VoiceLine {
  id: string;
  text: string;
  audio: string;
  triggeredBy: 'gameStart' | 'correctAnswer' | 'wrongAnswer' | 'newRound' | 'finalRound' | 'timeRunning' | 'idle';
  weight: number; // For random selection among same trigger type
}

export class GameHost {
  private hostElement: HTMLElement;
  private speechBubble: HTMLElement;
  private currentAudio: HTMLAudioElement | null = null;
  private voiceLines: VoiceLine[] = [];
  private idleTimer: number | null = null;
  
  constructor() {
    this.hostElement = document.getElementById('game-host') as HTMLElement;
    this.speechBubble = document.getElementById('speech-bubble') as HTMLElement;
    this.loadVoiceLines();
    this.setupIdleDetection();
  }
  
  private loadVoiceLines() {
    // These would be loaded from a JSON file in a real implementation
    this.voiceLines = [
      // Game Start
      {
        id: 'welcome1',
        text: "Welcome to Timeline Tunes, music fans! I'm DJ Chronos, your host for this musical journey through time!",
        audio: 'assets/audio/welcome1.mp3',
        triggeredBy: 'gameStart',
        weight: 1
      },
      {
        id: 'welcome2',
        text: "Hey there! Ready to test your knowledge of musical history? Let's see if you can place these tracks on our timeline!",
        audio: 'assets/audio/welcome2.mp3',
        triggeredBy: 'gameStart',
        weight: 1
      },
      
      // Correct Answer
      {
        id: 'correct1',
        text: "You've got the groove! That's exactly right!",
        audio: 'assets/audio/correct1.mp3',
        triggeredBy: 'correctAnswer',
        weight: 1
      },
      {
        id: 'correct2',
        text: "Whoa! You must have a time machine because that was spot on!",
        audio: 'assets/audio/correct2.mp3',
        triggeredBy: 'correctAnswer',
        weight: 1
      },
      
      // Wrong Answer
      {
        id: 'wrong1',
        text: "Ouch! That's not when this track dropped! Better brush up on your music history!",
        audio: 'assets/audio/wrong1.mp3',
        triggeredBy: 'wrongAnswer',
        weight: 1
      },
      {
        id: 'wrong2',
        text: "Not quite! This beat is from another era. Keep trying!",
        audio: 'assets/audio/wrong2.mp3',
        triggeredBy: 'wrongAnswer',
        weight: 1
      },
      
      // Idle comments
      {
        id: 'idle1',
        text: "Taking your time? The beat goes on, but our clock doesn't stop!",
        audio: 'assets/audio/idle1.mp3',
        triggeredBy: 'idle',
        weight: 1
      },
      {
        id: 'idle2',
        text: "Hey there, still grooving? Make your guess before the track fades out!",
        audio: 'assets/audio/idle2.mp3',
        triggeredBy: 'idle',
        weight: 1
      }
    ];
  }
  
  public speak(trigger: VoiceLine['triggeredBy']) {
    // Find all voice lines for this trigger
    const possibleLines = this.voiceLines.filter(line => line.triggeredBy === trigger);
    
    if (possibleLines.length === 0) return;
    
    // Choose one based on weight
    const totalWeight = possibleLines.reduce((sum, line) => sum + line.weight, 0);
    let random = Math.random() * totalWeight;
    
    let selectedLine: VoiceLine | null = null;
    for (const line of possibleLines) {
      random -= line.weight;
      if (random <= 0) {
        selectedLine = line;
        break;
      }
    }
    
    if (!selectedLine) selectedLine = possibleLines[0];
    
    this.displaySpeech(selectedLine);
  }
  
  private displaySpeech(line: VoiceLine) {
    // Stop any current speech
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    
    // Show speech bubble with text
    this.speechBubble.textContent = line.text;
    this.speechBubble.style.display = 'block';
    
    // Animate host
    this.hostElement.classList.add('speaking');
    
    // Play audio
    this.currentAudio = new Audio(line.audio);
    this.currentAudio.play();
    
    // Hide speech bubble after audio finishes
    this.currentAudio.onended = () => {
      this.speechBubble.style.display = 'none';
      this.hostElement.classList.remove('speaking');
      this.currentAudio = null;
    };
  }
  
  private setupIdleDetection() {
    // Reset idle timer on any user interaction
    const resetIdleTimer = () => {
      if (this.idleTimer) clearTimeout(this.idleTimer);
      this.idleTimer = setTimeout(() => this.speak('idle'), 20000) as unknown as number;
    };
    
    // Add event listeners to reset idle timer
    document.addEventListener('mousemove', resetIdleTimer);
    document.addEventListener('mousedown', resetIdleTimer);
    document.addEventListener('touchstart', resetIdleTimer);
    document.addEventListener('keypress', resetIdleTimer);
    
    // Initial setup
    resetIdleTimer();
  }
}

export default GameHost;
