import React from 'react';
import { Loader2, Music2, Download, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface LoadingScreenProps {
  title?: string;
  message?: string;
  progress?: number;
  showProgress?: boolean;
  steps?: Array<{
    name: string;
    status: 'pending' | 'loading' | 'complete';
  }>;
}

export function LoadingScreen({ 
  title = "Starting Game", 
  message = "Loading songs and preparing your timeline...",
  progress = 0,
  showProgress = false,
  steps = []
}: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-secondary/20 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-3xl p-8 shadow-2xl max-w-md w-full text-center space-y-6">
        {/* Animated vinyl record */}
        <div className="relative mx-auto w-24 h-24 mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/60 rounded-full animate-spin-slow"></div>
          <div className="absolute inset-2 bg-card rounded-full flex items-center justify-center">
            <div className="w-4 h-4 bg-primary rounded-full"></div>
          </div>
          <Music2 className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-primary-foreground animate-pulse" />
        </div>

        {/* Title and message */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          <p className="text-muted-foreground">{message}</p>
        </div>

        {/* Progress bar */}
        {showProgress && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground">{Math.round(progress)}% complete</p>
          </div>
        )}

        {/* Loading steps */}
        {steps.length > 0 && (
          <div className="space-y-3 text-left">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center space-x-3">
                {step.status === 'pending' && (
                  <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30"></div>
                )}
                {step.status === 'loading' && (
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                )}
                {step.status === 'complete' && (
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                )}
                <span className={`text-sm ${
                  step.status === 'complete' 
                    ? 'text-emerald-500' 
                    : step.status === 'loading'
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}>
                  {step.name}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Loading indicator */}
        <div className="flex items-center justify-center space-x-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Please wait...</span>
        </div>
      </div>
    </div>
  );
}

// Default loading screen for game initialization
export function GameLoadingScreen() {
  return (
    <LoadingScreen
      title="Preparing Your Game"
      message="Loading songs, creating timelines, and shuffling the deck..."
      steps={[
        { name: "Fetching song library", status: "loading" },
        { name: "Validating audio previews", status: "pending" },
        { name: "Creating player timelines", status: "pending" },
        { name: "Shuffling mystery cards", status: "pending" },
      ]}
    />
  );
}

// Loading screen for song fetching with progress
export function SongLoadingScreen({ progress, songsLoaded, totalSongs }: { 
  progress: number; 
  songsLoaded: number; 
  totalSongs: number; 
}) {
  return (
    <LoadingScreen
      title="Loading Songs"
      message={`Finding songs with audio previews... ${songsLoaded}/${totalSongs} ready`}
      progress={progress}
      showProgress={true}
      steps={[
        { 
          name: `Loading song metadata (${songsLoaded}/${totalSongs})`, 
          status: songsLoaded === totalSongs ? "complete" : "loading" 
        },
        { 
          name: "Validating audio previews", 
          status: songsLoaded === totalSongs ? "complete" : "pending" 
        },
        { 
          name: "Preparing game deck", 
          status: songsLoaded === totalSongs ? "loading" : "pending" 
        },
      ]}
    />
  );
}