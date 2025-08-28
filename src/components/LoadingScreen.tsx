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
    <div className="min-h-screen bg-gradient-to-br from-[#161616] to-[#0e0e0e] relative overflow-hidden flex items-center justify-center p-4">
      {/* Enhanced Dark Background Effects matching MainMenu */}
      <div className="absolute inset-0">
        {/* Main glow effects with smoother animations */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#107793]/10 rounded-full blur-2xl animate-pulse-ultra-slow" />
        <div className="absolute top-1/2 right-1/4 w-40 h-40 bg-[#a53b8b]/10 rounded-full blur-2xl animate-pulse-ultra-slow" style={{animationDelay: '2s'}} />
        <div className="absolute bottom-1/4 left-1/2 w-36 h-36 bg-[#4a4f5b]/8 rounded-full blur-2xl animate-pulse-ultra-slow" style={{animationDelay: '4s'}} />
        
        {/* Additional scattered glows with gentle animations */}
        <div className="absolute top-16 right-16 w-24 h-24 bg-[#107793]/5 rounded-full blur-xl animate-glow-gentle" />
        <div className="absolute bottom-32 left-16 w-28 h-28 bg-[#a53b8b]/5 rounded-full blur-xl animate-glow-gentle" style={{animationDelay: '3s'}} />
        <div className="absolute top-1/3 left-1/6 w-20 h-20 bg-[#4a4f5b]/4 rounded-full blur-lg animate-pulse-slow" />
        <div className="absolute bottom-1/3 right-1/6 w-32 h-32 bg-[#107793]/4 rounded-full blur-lg animate-pulse-slow" style={{animationDelay: '1.5s'}} />
      </div>

      <div className="relative bg-gradient-to-br from-[#1a1a1a] via-[#222] to-[#1e1e1e] border border-[#333] rounded-3xl p-8 shadow-2xl max-w-md w-full text-center space-y-6 backdrop-blur-sm">
        {/* Animated vinyl record matching the main menu style */}
        <div className="relative mx-auto w-24 h-24 mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-[#107793] to-[#a53b8b] rounded-full animate-spin-slow shadow-lg"></div>
          <div className="absolute inset-2 bg-[#1a1a1a] rounded-full flex items-center justify-center">
            <div className="w-4 h-4 bg-gradient-to-br from-[#107793] to-[#a53b8b] rounded-full"></div>
          </div>
          <Music2 className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-white animate-pulse" />
        </div>

        {/* Title and message with enhanced styling */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <p className="text-gray-300">{message}</p>
        </div>

        {/* Progress bar with custom styling */}
        {showProgress && (
          <div className="space-y-2">
            <div className="h-2 bg-[#333] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#107793] to-[#a53b8b] transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-400">{Math.round(progress)}% complete</p>
          </div>
        )}

        {/* Loading steps with enhanced dark styling */}
        {steps.length > 0 && (
          <div className="space-y-3 text-left">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center space-x-3">
                {step.status === 'pending' && (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-500"></div>
                )}
                {step.status === 'loading' && (
                  <Loader2 className="w-5 h-5 text-[#107793] animate-spin" />
                )}
                {step.status === 'complete' && (
                  <CheckCircle className="w-5 h-5 text-[#a53b8b]" />
                )}
                <span className={`text-sm ${
                  step.status === 'complete' 
                    ? 'text-[#a53b8b]' 
                    : step.status === 'loading'
                    ? 'text-[#107793]'
                    : 'text-gray-400'
                }`}>
                  {step.name}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Loading indicator with enhanced styling */}
        <div className="flex items-center justify-center space-x-2 text-gray-400">
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