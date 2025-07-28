import React from 'react';
import { Music, Disc, Play, Users, Timer } from 'lucide-react';

interface LoadingScreenProps {
  title?: string;
  subtitle?: string;
  variant?: 'game' | 'connection' | 'initialization';
  showProgress?: boolean;
  progress?: number;
}

export function LoadingScreen({ 
  title = "Getting ready...", 
  subtitle = "Setting up your music experience",
  variant = 'game',
  showProgress = false,
  progress = 0
}: LoadingScreenProps) {
  const getIcon = () => {
    switch (variant) {
      case 'connection':
        return Users;
      case 'initialization':
        return Timer;
      default:
        return Music;
    }
  };

  const Icon = getIcon();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-800 to-slate-900 relative overflow-hidden flex items-center justify-center">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Floating Music Notes */}
        <div className="absolute top-1/4 left-1/4 animate-float opacity-20">
          <Music className="w-8 h-8 text-blue-400 animate-pulse" style={{ animationDelay: '0s' }} />
        </div>
        <div className="absolute top-1/3 right-1/4 animate-float opacity-20">
          <Disc className="w-12 h-12 text-purple-400 animate-spin-slow" style={{ animationDelay: '1s' }} />
        </div>
        <div className="absolute bottom-1/3 left-1/3 animate-float opacity-20">
          <Play className="w-6 h-6 text-cyan-400 animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
        
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1.5s'}} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/5 rounded-full blur-2xl animate-pulse-slow" style={{animationDelay: '3s'}} />
        
        {/* Animated Lines */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-scan" />
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-scan" style={{animationDelay: '2s'}} />
        </div>
      </div>
      
      {/* Main Content */}
      <div className="text-center text-white relative z-10 max-w-md mx-auto px-4">
        {/* Main Icon Container */}
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-white/5 backdrop-blur-xl rounded-full flex items-center justify-center mb-4 mx-auto border border-white/10 shadow-2xl">
            <div className="relative">
              <Icon className="w-12 h-12 text-white animate-pulse" />
              {/* Rotating Ring */}
              <div className="absolute inset-0 w-12 h-12 border-2 border-transparent border-t-blue-400 rounded-full animate-spin" />
            </div>
          </div>
          
          {/* Pulsing Rings */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-32 h-32 border border-white/20 rounded-full animate-ping opacity-20" />
            <div className="w-40 h-40 border border-white/10 rounded-full animate-ping opacity-10" style={{animationDelay: '0.5s'}} />
          </div>
        </div>
        
        {/* Text Content */}
        <div className="space-y-3">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent animate-gradient">
            {title}
          </h2>
          <p className="text-white/70 text-lg leading-relaxed">
            {subtitle}
          </p>
        </div>
        
        {/* Progress Bar */}
        {showProgress && (
          <div className="mt-8 space-y-2">
            <div className="w-full bg-white/10 rounded-full h-2 backdrop-blur-sm border border-white/20">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                style={{ width: `${Math.min(progress, 100)}%` }}
              >
                <div className="absolute inset-0 bg-white/30 animate-shimmer" />
              </div>
            </div>
            <div className="text-white/50 text-sm">
              {Math.round(progress)}% complete
            </div>
          </div>
        )}
        
        {/* Loading Dots */}
        <div className="flex justify-center space-x-2 mt-6">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}} />
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
        </div>
      </div>
    </div>
  );
}