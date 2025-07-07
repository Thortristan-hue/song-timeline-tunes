
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Copy, Users, Play, ArrowLeft, AlertCircle } from 'lucide-react';
import { QRCodeGenerator } from '@/components/QRCodeGenerator';
import { PlaylistLoader } from '@/components/PlaylistLoader';
import { Player, Song } from '@/types/game';
import { useToast } from '@/components/ui/use-toast';
import { useSoundEffects } from '@/hooks/useSoundEffects';

interface HostLobbyProps {
  lobbyCode: string;
  players: Player[];
  onStartGame: () => Promise<void>;
  onBackToMenu: () => void;
  setCustomSongs: (songs: Song[]) => void;
  isLoading: boolean;
  // REMOVED: createRoom prop to prevent double creation
}

export function HostLobby({
  lobbyCode,
  players,
  onStartGame,
  onBackToMenu,
  setCustomSongs,
  isLoading
}: HostLobbyProps) {
  const { toast } = useToast();
  const soundEffects = useSoundEffects();
  const [playlistLoaded, setPlaylistLoaded] = useState(false);
  const [playlistSongCount, setPlaylistSongCount] = useState(0);
  const [isStartingGame, setIsStartingGame] = useState(false);

  // REMOVED: Room creation logic - now handled by Index.tsx
  // This eliminates the double creation and race condition

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(lobbyCode);
      await soundEffects.playButtonClick();
      toast({
        title: "Copied!",
        description: "Room code copied to clipboard",
      });
    } catch (err) {
      console.error('Failed to copy: ', err);
      toast({
        title: "Copy Failed",
        description: "Failed to copy room code. Please copy manually.",
        variant: "destructive",
      });
    }
  };

  const handlePlaylistLoaded = (success: boolean, count?: number) => {
    setPlaylistLoaded(success);
    if (success && count) {
      setPlaylistSongCount(count);
      toast({
        title: "Playlist Ready!",
        description: `${count} songs loaded and ready for gameplay`,
      });
    }
  };

  const handleStartGame = async () => {
    if (!playlistLoaded) {
      toast({
        title: "Cannot Start Game",
        description: "Please load a playlist before starting the game.",
        variant: "destructive",
      });
      return;
    }

    if (playlistSongCount < 10) {
      toast({
        title: "Not Enough Songs",
        description: `You have ${playlistSongCount} songs, but need at least 10 to start the game.`,
        variant: "destructive",
      });
      return;
    }

    setIsStartingGame(true);
    try {
      await soundEffects.playButtonClick();
      await onStartGame();
    } catch (error) {
      console.error('Failed to start game:', error);
      toast({
        title: "Game Start Failed",
        description: "Failed to start the game. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsStartingGame(false);
    }
  };

  // SIMPLIFIED: No loading screen logic needed - handled by parent
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            onClick={onBackToMenu}
            variant="ghost"
            className="text-white hover:bg-white/10"
            disabled={isLoading || isStartingGame}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Menu
          </Button>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-2">Host Lobby</h1>
            <p className="text-purple-200">Set up your game and wait for players</p>
          </div>
          <div className="w-32" /> {/* Spacer for centering */}
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Room Info & Players */}
          <div className="space-y-6">
            {/* Room Code Card */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
              <div className="text-center">
                <div className="text-white/80 text-sm mb-2">Room Code</div>
                <div className="text-4xl font-bold text-white mb-4 tracking-wider">
                  {lobbyCode || '------'}
                </div>
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                  disabled={!lobbyCode}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Code
                </Button>
              </div>
            </Card>

            {/* QR Code */}
            {lobbyCode && (
              <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
                <div className="text-center">
                  <div className="text-white/80 text-sm mb-4">Scan to Join</div>
                  <div className="flex justify-center">
                    <QRCodeGenerator value={lobbyCode} />
                  </div>
                </div>
              </Card>
            )}

            {/* Players List */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-white" />
                <h3 className="text-lg font-semibold text-white">
                  Players ({players.length})
                </h3>
              </div>
              <div className="space-y-2">
                {players.length === 0 ? (
                  <div className="text-white/60 text-center py-4">
                    Waiting for players to join...
                  </div>
                ) : (
                  players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center gap-3 p-3 bg-white/5 rounded-lg"
                    >
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: player.color }}
                      />
                      <span className="text-white font-medium">{player.name}</span>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Right Column - Game Setup */}
          <div className="space-y-6">
            {/* Playlist Loader */}
            <PlaylistLoader
              onPlaylistLoaded={handlePlaylistLoaded}
              setCustomSongs={setCustomSongs}
              isDarkMode={true}
              minSongsRequired={10}
            />

            {/* Game Status */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Game Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/80">Playlist:</span>
                  <span className={`font-medium ${playlistLoaded ? 'text-green-400' : 'text-yellow-400'}`}>
                    {playlistLoaded ? `${playlistSongCount} songs loaded` : 'Not loaded'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/80">Players:</span>
                  <span className="text-white font-medium">{players.length} joined</span>
                </div>
              </div>

              {!playlistLoaded && (
                <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-200">
                      Load a playlist with at least 10 songs before starting the game.
                    </div>
                  </div>
                </div>
              )}

              {playlistLoaded && playlistSongCount < 10 && (
                <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-red-200">
                      Need at least 10 songs to start. Current: {playlistSongCount}
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Start Game Button */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
              <Button
                onClick={handleStartGame}
                disabled={!playlistLoaded || playlistSongCount < 10 || isLoading || isStartingGame}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isStartingGame ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Starting Game...
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 mr-2" />
                    Start Game
                  </>
                )}
              </Button>
              
              {(!playlistLoaded || playlistSongCount < 10) && (
                <p className="text-white/60 text-sm text-center mt-2">
                  {!playlistLoaded 
                    ? "Load a playlist to enable game start"
                    : `Need ${10 - playlistSongCount} more songs to start`
                  }
                </p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
