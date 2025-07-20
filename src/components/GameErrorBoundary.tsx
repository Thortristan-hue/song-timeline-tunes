
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class GameErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 Game Error Boundary caught error:', error, errorInfo);
    
    // ENHANCED: Specific handling for lexical declaration errors
    if (error.message.includes('lexical declaration') || 
        error.message.includes('before initialization') ||
        error.message.includes('Cannot access') ||
        error.message.includes('Identifier') && error.message.includes('already been declared')) {
      console.error('🚨 LEXICAL DECLARATION ERROR DETECTED:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }
    
    // ENHANCED: Specific handling for game start errors
    if (error.message.includes('playersCount') || 
        error.message.includes('No players') ||
        error.message.includes('game start')) {
      console.error('🚨 GAME START ERROR DETECTED:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }
    
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 flex items-center justify-center p-4">
          <Card className="max-w-md p-8 bg-red-900/20 border-red-500/50 text-center">
            <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Game Error</h2>
            <p className="text-red-200 mb-4">
              Something went wrong with the game. This error has been logged.
              {this.state.error?.message.includes('lexical declaration') && (
                <span className="block mt-2 text-red-300">
                  This appears to be a code initialization error. Please refresh the page.
                </span>
              )}
              {this.state.error?.message.includes('No players') && (
                <span className="block mt-2 text-red-300">
                  Player data couldn't be loaded. Please rejoin the game.
                </span>
              )}
            </p>
            <div className="text-sm text-red-300 mb-6 p-3 bg-red-900/30 rounded-lg font-mono text-left max-h-32 overflow-y-auto">
              {this.state.error?.message || 'Unknown error'}
            </div>
            <Button 
              onClick={() => window.location.reload()} 
              className="bg-red-600 hover:bg-red-700 w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Game
            </Button>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
