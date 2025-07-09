import React, { useEffect, useState } from 'react';
import { Crown, Users, Play, Settings, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useGameRoom } from '@/hooks/useGameRoom';
import { useGameLogic } from '@/hooks/useGameLogic';
import { PlaylistLoader } from '@/components/PlaylistLoader';
import { QRCodeGenerator } from '@/components/QRCodeGenerator';
import { Song } from '@/types/game';
import { useToast } from '@/components/ui/use-toast';
import { HostGameView } from '@/components/HostVisuals';

interface HostLobbyProps {
  onGameStart: () => void;
}

export function HostLobby({ onGameStart }: HostLobbyProps) {
  const { toast } = useToast();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [availableSongs, setAvailableSongs] = useState<Song[]>([]);
  const [qrCodeValue, setQrCodeValue] = useState('');

  const {
    room,
    players,
    isLoading,
    updateRoomSongs,
    startGame,
    assignStartingCards,
    removePlayer
  } = useGameRoom();

  const {
    fetchSongsFromPlaylist,
    isLoading: isPlaylistLoading,
    error: playlistError
  } = useGameLogic();

  useEffect(() => {
    if (room) {
      setQrCodeValue(`${window.location.origin}/join/${room.lobby_code}`);
    }
  }, [room]);

  const handlePlaylistLoad = async (playlistUrl: string) => {
    const songs = await fetchSongsFromPlaylist(playlistUrl);
    if (songs) {
      setAvailableSongs(songs);
      await updateRoomSongs(songs);
      toast({
        title: "Playlist Loaded",
        description: `${songs.length} songs loaded from the playlist.`,
      });
    } else {
      toast({
        title: "Error",
        description: `Failed to load playlist. ${playlistError || 'Please check the URL and try again.'}`,
        variant: "destructive",
      });
    }
  };

  const handleGameStart = async () => {
    if (availableSongs.length < 3) {
      toast({
        title: "Error",
        description: "You need at least 3 songs to start the game.",
        variant: "destructive",
      });
      return;
    }

    const success = await startGame(availableSongs);
    if (success) {
      await assignStartingCards(availableSongs);
      toast({
        title: "Game Started",
        description: "The game has started!",
      });
      onGameStart();
    } else {
      toast({
        title: "Error",
        description: "Failed to start the game. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemovePlayer = async (playerId: string) => {
    const success = await removePlayer(playerId);
    if (success) {
      toast({
        title: "Player Removed",
        description: "Player has been successfully removed from the lobby.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to remove player. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!room) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-xl text-gray-600">Loading lobby...</div>
        </div>
      </div>
    );
  }

  return (
    <HostGameView
      roomCode={room.lobby_code}
      players={players}
      onRemovePlayer={handleRemovePlayer}
    />
  );
}
