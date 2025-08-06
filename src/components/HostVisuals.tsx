
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Music, Play, Pause } from 'lucide-react';
import { Song, Player } from '@/types/game';
import { HostCurrentPlayerTimeline } from './host/HostCurrentPlayerTimeline';
import { HostAllPlayersOverview } from './host/HostAllPlayersOverview';
import { audioEngine } from '@/utils/audioEngine';
import { getActualPlayers } from '@/utils/playerUtils';

interface HostVisualsProps {
  room: any;
  players: Player[];
  mysteryCard: Song | null;
  isHost: boolean;
}

export function HostVisuals({ room, players, mysteryCard, isHost }: HostVisualsProps) {
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  
  // Get actual players (excluding host)
  const actualPlayers = getActualPlayers(players, room?.host_id);
  
  // Determine current player - use room's current_player_id if available, otherwise use index
  const getCurrentPlayer = (): Player | null => {
    if (actualPlayers.length === 0) return null;
    
    if (room?.current_player_id) {
      const playerById = actualPlayers.find(p => p.id === room.current_player_id);
      if (playerById) return playerById;
    }
    
    // Fallback to index-based selection
    const validIndex = Math.min(currentTurnIndex, actualPlayers.length - 1);
    return actualPlayers[validIndex] || null;
  };

  const currentPlayer = getCurrentPlayer();

  // Update current turn index when room's current_player_id changes
  useEffect(() => {
    if (room?.current_player_id && actualPlayers.length > 0) {
      const playerIndex = actualPlayers.findIndex(p => p.id === room.current_player_id);
      if (playerIndex >= 0) {
        setCurrentTurnIndex(playerIndex);
      }
    }
  }, [room?.current_player_id, actualPlayers]);

  const handlePlayPreview = async () => {
    if (!mysteryCard?.preview_url) {
      console.warn('No preview URL available for mystery card');
      return;
    }

    try {
      if (isPlayingPreview) {
        audioEngine.stopPreview();
        setIsPlayingPreview(false);
      } else {
        audioEngine.playPreview(mysteryCard.preview_url);
        setIsPlayingPreview(true);
        
        // Auto-stop after 30 seconds
        setTimeout(() => {
          setIsPlayingPreview(false);
        }, 30000);
      }
    } catch (error) {
      console.error('Error playing preview:', error);
      setIsPlayingPreview(false);
    }
  };

  // Show loading state if no players or no current player
  if (actualPlayers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-800 text-white">
        <Music className="h-16 w-16 mb-4 animate-pulse" />
        <h2 className="text-2xl font-bold mb-2">Waiting for Players...</h2>
        <p className="text-lg opacity-75">The game will start once players join the lobby.</p>
      </div>
    );
  }

  if (!currentPlayer) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-800 text-white">
        <Music className="h-16 w-16 mb-4 animate-spin" />
        <h2 className="text-2xl font-bold mb-2">Initializing Game...</h2>
        <p className="text-lg opacity-75">Setting up the first turn...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-800 text-white relative overflow-hidden">
      {/* Mystery Card Display */}
      {mysteryCard && (
        <div className="absolute top-4 right-4 z-30">
          <Card className="bg-black/20 backdrop-blur-sm border-white/20 p-4 min-w-64">
            <div className="flex flex-col items-center space-y-3">
              <div className="text-center">
                <h3 className="font-bold text-white text-lg">{mysteryCard.deezer_title}</h3>
                <p className="text-white/80">{mysteryCard.deezer_artist}</p>
                <p className="text-white/60 text-sm">{mysteryCard.release_year}</p>
              </div>
              
              {mysteryCard.preview_url && (
                <Button 
                  onClick={handlePlayPreview}
                  disabled={isPlayingPreview}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isPlayingPreview ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Playing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Play Preview
                    </>
                  )}
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Current Player Section */}
      <div className="flex-1 flex flex-col justify-center px-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">
            {currentPlayer.name}'s Turn
          </h1>
          <p className="text-xl opacity-75">
            Place the mystery song in the timeline
          </p>
        </div>

        {/* Current Player Timeline */}
        <div className="flex-1 flex items-center justify-center">
          <HostCurrentPlayerTimeline 
            currentTurnPlayer={currentPlayer}
            cardPlacementResult={null}
            highlightedGapIndex={null}
            isTransitioning={false}
          />
        </div>
      </div>

      {/* All Players Overview */}
      <div className="h-48 border-t border-white/20 bg-black/10">
        <HostAllPlayersOverview 
          players={actualPlayers}
          currentTurnPlayer={currentPlayer}
        />
      </div>
    </div>
  );
}
