import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipForward, RefreshCw } from 'lucide-react';
import { audioManager } from '@/services/AudioManager';
import { turnManager } from '@/lib/TurnManager';
import { Song } from '@/types/game';

interface TurnAndAudioDebuggerProps {
  roomId: string;
  isHost: boolean;
  currentSong?: Song;
}

/**
 * Debug component to test turn management and universal audio control
 * Shows real-time status and provides manual controls for testing
 */
export default function TurnAndAudioDebugger({ 
  roomId, 
  isHost, 
  currentSong 
}: TurnAndAudioDebuggerProps) {
  const [audioIsPlaying, setAudioIsPlaying] = useState(false);
  const [turnState, setTurnState] = useState(turnManager.getTransitionState());
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
  };

  useEffect(() => {
    // Initialize audio manager
    audioManager.initialize(roomId, isHost);
    addLog(`Initialized as ${isHost ? 'HOST' : 'MOBILE'} for room ${roomId}`);

    // Set up audio state listener
    const handleAudioStateChange = (isPlaying: boolean, song?: Song) => {
      setAudioIsPlaying(isPlaying);
      addLog(`Audio state: ${isPlaying ? 'PLAYING' : 'STOPPED'} ${song ? `- ${song.deezer_title}` : ''}`);
    };

    audioManager.addPlayStateListener(handleAudioStateChange);
    setAudioIsPlaying(audioManager.getIsPlaying());

    // Set up turn state listener
    const handleTurnStateChange = (state: any) => {
      setTurnState(state);
      addLog(`Turn state: ${state.phase} (${state.animationProgress}%)`);
    };

    turnManager.setStateChangeListener(handleTurnStateChange);

    return () => {
      audioManager.removePlayStateListener(handleAudioStateChange);
      audioManager.cleanup();
    };
  }, [roomId, isHost]);

  const testAudioControl = async () => {
    if (!currentSong) {
      addLog('❌ No current song available for testing');
      return;
    }

    addLog(`🎵 Testing audio control: ${currentSong.deezer_title}`);
    
    try {
      const success = await audioManager.togglePlayPause(currentSong);
      addLog(`🎵 Audio control result: ${success ? 'SUCCESS' : 'FAILED'}`);
    } catch (error) {
      addLog(`❌ Audio control error: ${error}`);
    }
  };

  const testUniversalControl = async () => {
    if (!currentSong) {
      addLog('❌ No current song available for universal control test');
      return;
    }

    addLog(`📱 Testing universal control (mobile -> host)`);
    
    try {
      const success = await audioManager.sendUniversalAudioControl('toggle', currentSong);
      addLog(`📱 Universal control result: ${success ? 'SUCCESS' : 'FAILED'}`);
    } catch (error) {
      addLog(`❌ Universal control error: ${error}`);
    }
  };

  const resetTurnManager = () => {
    addLog('🔄 Resetting turn manager');
    turnManager.forceReset();
  };

  return (
    <div className="fixed bottom-4 right-4 bg-slate-900/95 border border-slate-700 rounded-lg p-4 max-w-md">
      <div className="text-white text-sm font-semibold mb-3">
        🔧 Turn & Audio Debugger
      </div>
      
      {/* Status */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
        <div className="bg-slate-800 rounded p-2">
          <div className="text-slate-400">Role</div>
          <div className="text-white font-mono">{isHost ? 'HOST' : 'MOBILE'}</div>
        </div>
        <div className="bg-slate-800 rounded p-2">
          <div className="text-slate-400">Audio</div>
          <div className={`font-mono ${audioIsPlaying ? 'text-green-400' : 'text-red-400'}`}>
            {audioIsPlaying ? 'PLAYING' : 'STOPPED'}
          </div>
        </div>
        <div className="bg-slate-800 rounded p-2">
          <div className="text-slate-400">Turn State</div>
          <div className="text-white font-mono text-xs">{turnState.phase}</div>
        </div>
        <div className="bg-slate-800 rounded p-2">
          <div className="text-slate-400">Progress</div>
          <div className="text-white font-mono">{turnState.animationProgress}%</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2 mb-3">
        <Button
          size="sm"
          variant="outline"
          onClick={testAudioControl}
          disabled={!currentSong}
          className="flex-1"
        >
          <Play className="w-3 h-3 mr-1" />
          Test Audio
        </Button>
        
        {!isHost && (
          <Button
            size="sm"
            variant="outline"
            onClick={testUniversalControl}
            disabled={!currentSong}
            className="flex-1"
          >
            📱 Universal
          </Button>
        )}
        
        <Button
          size="sm"
          variant="outline"
          onClick={resetTurnManager}
        >
          <RefreshCw className="w-3 h-3" />
        </Button>
      </div>

      {/* Song Info */}
      {currentSong && (
        <div className="bg-slate-800 rounded p-2 mb-3 text-xs">
          <div className="text-slate-400">Current Song</div>
          <div className="text-white font-semibold truncate">{currentSong.deezer_title}</div>
          <div className="text-slate-400 truncate">{currentSong.deezer_artist}</div>
          <div className="text-slate-500">{currentSong.release_year}</div>
        </div>
      )}

      {/* Log */}
      <div className="bg-slate-800 rounded p-2 max-h-32 overflow-y-auto">
        <div className="text-slate-400 text-xs mb-1">Debug Log</div>
        {logs.length === 0 ? (
          <div className="text-slate-500 text-xs">No events yet...</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="text-xs text-slate-300 font-mono leading-tight mb-1">
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}