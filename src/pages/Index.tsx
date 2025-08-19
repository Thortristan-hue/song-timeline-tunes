
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GameMode, GameModeSettings } from '@/types/game';
import { useGameRoom } from '@/hooks/useGameRoom';
import { CharacterSelect } from '@/components/CharacterSelect';

interface RoomFormProps {
  onCreateRoom: (gamemode: GameMode, settings: GameModeSettings) => Promise<boolean>;
  onJoinRoom: (lobbyCode: string, playerName: string, character: string) => Promise<boolean>;
  isLoading: boolean;
}

const RoomForm: React.FC<RoomFormProps> = ({ onCreateRoom, onJoinRoom, isLoading }) => {
  const [playerName, setPlayerName] = useState('');
  const [lobbyCode, setLobbyCode] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState('char_dave');
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [joiningRoom, setJoiningRoom] = useState(false);

  const handleCreateRoom = async (gamemode: GameMode, gameModeSettings: GameModeSettings) => {
    if (!playerName) {
      toast.error("Please enter your name to create a room.");
      return;
    }

    setCreatingRoom(true);
    const success = await onCreateRoom(gamemode, gameModeSettings);
    setCreatingRoom(false);

    if (success) {
      toast.success("Room created successfully!");
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName || !lobbyCode) {
      toast.error("Please enter your name and lobby code to join a room.");
      return;
    }

    setJoiningRoom(true);
    const success = await onJoinRoom(lobbyCode, playerName, selectedCharacter);
    setJoiningRoom(false);

    if (success) {
      toast.success("Joined room successfully!");
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Create Room</CardTitle>
          <CardDescription>Create a new game room to play with friends.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
          </div>
          <CharacterSelect onSelect={setSelectedCharacter} />
          <Button disabled={isLoading || creatingRoom} onClick={() => handleCreateRoom('classic', {})}>
            {isLoading || creatingRoom ? 'Creating...' : 'Create Classic Room'}
          </Button>
          <Button disabled={isLoading || creatingRoom} onClick={() => handleCreateRoom('sprint', { targetCards: 8 })}>
            {isLoading || creatingRoom ? 'Creating...' : 'Create Sprint Room'}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Join Room</CardTitle>
          <CardDescription>Join an existing game room using a lobby code.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="joinName">Your Name</Label>
            <Input
              id="joinName"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lobbyCode">Lobby Code</Label>
            <Input
              id="lobbyCode"
              placeholder="Enter lobby code"
              value={lobbyCode}
              onChange={(e) => setLobbyCode(e.target.value)}
            />
          </div>
          <CharacterSelect onSelect={setSelectedCharacter} />
          <Button disabled={isLoading || joiningRoom} onClick={handleJoinRoom}>
            {isLoading || joiningRoom ? 'Joining...' : 'Join Room'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default function Index() {
  const navigate = useNavigate();

  const {
    roomData,
    players,
    currentPlayer,
    isHost,
    isLoading,
    error,
    createRoom,
    joinRoom,
    startGame,
    placeCard,
    leaveRoom,
    resetRoom
  } = useGameRoom();

  useEffect(() => {
    if (roomData && roomData.phase !== 'lobby') {
      navigate(`/game?lobby=${roomData.lobby_code}`);
    }
  }, [roomData, navigate]);

  const handleCreateRoom = async (gamemode: GameMode, settings: GameModeSettings): Promise<boolean> => {
    const gameSettings = gamemode === 'sprint' ? { targetCards: 8 } : {};
    return await createRoom(gamemode, gameSettings);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-center text-white mb-8">
          Welcome to Timeline Titans!
        </h1>
        <div className="max-w-md mx-auto">
          <RoomForm
            onCreateRoom={handleCreateRoom}
            onJoinRoom={joinRoom}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
