import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { PlaylistLoader } from '@/components/PlaylistLoader';
import { QRCodeGenerator } from '@/components/QRCodeGenerator';
import { Crown, Users, Play, ArrowLeft, Copy, Check, Music2, Volume2, Radio, Headphones, X, Settings, Gamepad2, Timer, Target } from 'lucide-react';
import { Player, Song, GameRoom, GameMode, GameModeSettings } from '@/types/game';
import { useToast } from '@/components/ui/use-toast';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { getCharacterById, getDefaultCharacter } from '@/constants/characters';

interface HostLobbyProps {
  room: GameRoom | null;
  lobbyCode: string;
  players: Player[];
  onStartGame: () => Promise<void>;
  onBackToMenu: () => void;
  setCustomSongs: (songs: Song[]) => void;
  isLoading: boolean;
  createRoom: () => Promise<boolean>;
  onKickPlayer?: (playerId: string) => void;
  updateRoomGamemode: (gamemode: GameMode, settings: GameModeSettings) => Promise<boolean>;
}

export function HostLobby({
  room,
  lobbyCode,
  players,
  onStartGame,
  onBackToMenu,
  setCustomSongs,
  isLoading,
  createRoom,
  onKickPlayer,
  updateRoomGamemode
}: HostLobbyProps) {
  const { toast } = useToast();
  const soundEffects = useSoundEffects();
  const [copied, setCopied] = useState(false);
  const [roomCreated, setRoomCreated] = useState(!!lobbyCode);
  
  // Gamemode state
  const [selectedGamemode, setSelectedGamemode] = useState<GameMode>(room?.gamemode || 'classic');
  const [gamemodeSettings, setGamemodeSettings] = useState<GameModeSettings>(room?.gamemode_settings || {});

  // Debug logging for player updates
  useEffect(() => {
    console.log('🧍 HostLobby: Players updated:', players);
    console.log('🧍 HostLobby: Player count:', players.length);
  }, [players]);

  const handleCreateRoom = useCallback(async () => {
    console.log('🏠 Creating room...');
    const success = await createRoom();
    if (success) {
      setRoomCreated(true);
      soundEffects.playGameStart();
      console.log('✅ Room created successfully');
    } else {
      console.error('❌ Failed to create room');
    }
  }, [createRoom, soundEffects]);

  useEffect(() => {
    if (!roomCreated && !isLoading) {
      handleCreateRoom();
    }
  }, [roomCreated, isLoading, handleCreateRoom]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(lobbyCode);
      setCopied(true);
      soundEffects.playButtonClick();
      toast({
        title: "Copied!",
        description: "Room code copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please copy the code manually",
        variant: "destructive",
      });
    }
  };

  const handleKickPlayer = (playerId: string, playerName: string) => {
    if (onKickPlayer) {
      const confirmed = confirm(`Remove ${playerName} from the game?`);
      if (confirmed) {
        onKickPlayer(playerId);
        soundEffects.playButtonClick();
        toast({
          title: "Player removed",
          description: `${playerName} has been removed from the lobby`,
        });
      }
    }
  };

  // Handle gamemode changes
  const handleGamemodeChange = async (newGamemode: GameMode) => {
    setSelectedGamemode(newGamemode);
    
    // Set default settings for the new gamemode
    let defaultSettings: GameModeSettings = {};
    if (newGamemode === 'fiend') {
      defaultSettings = { rounds: 5 };
    } else if (newGamemode === 'sprint') {
      defaultSettings = { targetCards: 10 };
    }
    
    setGamemodeSettings(defaultSettings);
    
    // Update the room in the database
    if (room) {
      const success = await updateRoomGamemode(newGamemode, defaultSettings);
      if (success) {
        soundEffects.playButtonClick();
        toast({
          title: "Game mode updated",
          description: `Switched to ${newGamemode === 'classic' ? 'Classic/Timeliner' : newGamemode === 'fiend' ? 'Fiend Mode' : 'Sprint Mode'}`,
        });
      } else {
        toast({
          title: "Failed to update",
          description: "Could not change game mode",
          variant: "destructive",
        });
      }
    }
  };

  const handleSettingsChange = async (key: keyof GameModeSettings, value: number) => {
    const newSettings = { ...gamemodeSettings, [key]: value };
    setGamemodeSettings(newSettings);
    
    if (room) {
      const success = await updateRoomGamemode(selectedGamemode, newSettings);
      if (success) {
        soundEffects.playButtonClick();
      }
    }
  };

  // Play sound when players join
  useEffect(() => {
    if (players.length > 0) {
      soundEffects.playPlayerJoin();
    }
  }, [players.length, soundEffects]);

  if (!roomCreated || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#161616] to-[#0e0e0e] relative overflow-hidden">
        {/* Enhanced Dark Background Effects */}
        <div className="absolute inset-0">
          {/* Main glow effects */}
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#107793]/10 rounded-full blur-2xl animate-pulse" />
          <div className="absolute top-1/2 right-1/4 w-40 h-40 bg-[#a53b8b]/10 rounded-full blur-2xl animate-pulse" />
          <div className="absolute bottom-1/4 left-1/2 w-36 h-36 bg-[#4a4f5b]/8 rounded-full blur-2xl animate-pulse" />
          
          {/* Additional scattered glows */}
          <div className="absolute top-16 right-16 w-24 h-24 bg-[#107793]/5 rounded-full blur-xl" />
          <div className="absolute bottom-32 left-16 w-28 h-28 bg-[#a53b8b]/5 rounded-full blur-xl" />
          
          {/* Floating music notes */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <div 
                key={i}
                className="absolute animate-float opacity-20"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animation: `float ${8 + Math.random() * 12}s linear infinite`,
                  animationDelay: `${Math.random() * 3}s`,
                }}
              >
                {i % 2 === 0 ? (
                  <Music2 className="h-4 w-4 text-[#107793]" />
                ) : (
                  <Volume2 className="h-3 w-3 text-[#a53b8b]" />
                )}
              </div>
            ))}
          </div>

          {/* Geometric shapes */}
          <svg className="absolute inset-0 w-full h-full opacity-15" viewBox="0 0 1200 800" fill="none">
            {/* Music note shapes */}
            <circle cx="200" cy="200" r="4" fill="#107793" opacity="0.4" />
            <circle cx="1000" cy="300" r="6" fill="#a53b8b" opacity="0.4" />
            <circle cx="400" cy="600" r="3" fill="#4a4f5b" opacity="0.4" />
            
            {/* Connecting lines */}
            <path d="M200 200 L400 250 L600 230" stroke="#107793" strokeWidth="1" opacity="0.3" />
            <path d="M1000 300 L800 400 L700 380" stroke="#a53b8b" strokeWidth="1" opacity="0.3" />
            
            {/* Sound waves */}
            <path d="M300 400 Q350 380, 400 400 Q450 420, 500 400" stroke="#4a4f5b" strokeWidth="1" opacity="0.2" />
            <path d="M300 420 Q350 400, 400 420 Q450 440, 500 420" stroke="#4a4f5b" strokeWidth="1" opacity="0.2" />
          </svg>
        </div>
        
        <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-[#0e1f2f]/60 border-2 border-[#107793] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-[#107793]/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#107793]/10 to-transparent"></div>
              <Music2 className="h-10 w-10 text-[#107793] animate-bounce" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
              Setting up your room
            </h1>
            <p className="text-[#d9e8dd] font-medium">This'll just take a second...</p>
          </div>
        </div>
      </div>
    );
  }

  const gameUrl = `${window.location.origin}?join=${lobbyCode}`;
  console.log('🔗 Generated QR code URL:', gameUrl);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#161616] to-[#0e0e0e] relative overflow-hidden">
      {/* Enhanced Dark Background Effects */}
      <div className="absolute inset-0">
        {/* Main glow effects */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#107793]/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute top-1/2 right-1/4 w-40 h-40 bg-[#a53b8b]/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/2 w-36 h-36 bg-[#4a4f5b]/8 rounded-full blur-2xl animate-pulse" />
        
        {/* Additional scattered glows */}
        <div className="absolute top-16 right-16 w-24 h-24 bg-[#107793]/5 rounded-full blur-xl" />
        <div className="absolute bottom-32 left-16 w-28 h-28 bg-[#a53b8b]/5 rounded-full blur-xl" />
        <div className="absolute top-1/3 left-1/6 w-20 h-20 bg-[#4a4f5b]/4 rounded-full blur-lg" />
        <div className="absolute bottom-1/3 right-1/6 w-32 h-32 bg-[#107793]/4 rounded-full blur-lg" />
        
        {/* New ambient lighting */}
        <div className="absolute top-3/4 left-1/3 w-64 h-64 bg-[#a53b8b]/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/6 right-1/3 w-72 h-72 bg-[#0e1f2f]/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-20 left-1/2 w-96 h-96 bg-[#4a4f5b]/20 rounded-full blur-3xl" />
        
        {/* Geometric shapes */}
        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 1200 800" fill="none">
          {/* Music equipment shapes */}
          <rect x="100" y="100" width="60" height="40" rx="8" fill="#107793" opacity="0.2" transform="rotate(-10 130 120)" />
          <circle cx="120" cy="130" r="4" fill="#107793" opacity="0.3" />
          <circle cx="140" cy="130" r="4" fill="#107793" opacity="0.3" />
          
          <rect x="1000" y="200" width="60" height="40" rx="8" fill="#a53b8b" opacity="0.2" transform="rotate(15 1030 220)" />
          <circle cx="1020" cy="230" r="4" fill="#a53b8b" opacity="0.3" />
          <circle cx="1040" cy="230" r="4" fill="#a53b8b" opacity="0.3" />
          
          {/* Vinyl records */}
          <circle cx="200" cy="600" r="25" stroke="#4a4f5b" strokeWidth="2" fill="none" opacity="0.2" />
          <circle cx="200" cy="600" r="4" fill="#4a4f5b" opacity="0.3" />
          
          <circle cx="1050" cy="150" r="20" stroke="#107793" strokeWidth="2" fill="none" opacity="0.2" />
          <circle cx="1050" cy="150" r="3" fill="#107793" opacity="0.3" />
          
          {/* Music notes */}
          <circle cx="300" cy="200" r="4" fill="#a53b8b" opacity="0.3" />
          <path d="M304 200 L304 170" stroke="#a53b8b" strokeWidth="2" opacity="0.3" />
          <path d="M304 170 L314 175" stroke="#a53b8b" strokeWidth="2" opacity="0.3" />
          
          <circle cx="850" cy="500" r="4" fill="#107793" opacity="0.3" />
          <path d="M854 500 L854 470" stroke="#107793" strokeWidth="2" opacity="0.3" />
          <path d="M854 470 L864 475" stroke="#107793" strokeWidth="2" opacity="0.3" />
          
          {/* Sound waves */}
          <path d="M400 300 Q450 280, 500 300 Q550 320, 600 300" stroke="#4a4f5b" strokeWidth="1" opacity="0.2" />
          <path d="M400 320 Q450 300, 500 320 Q550 340, 600 320" stroke="#4a4f5b" strokeWidth="1" opacity="0.2" />
          <path d="M400 340 Q450 320, 500 340 Q550 360, 600 340" stroke="#4a4f5b" strokeWidth="1" opacity="0.2" />
          
          {/* Connecting lines */}
          <path d="M200 200 L400 250 L600 230" stroke="#107793" strokeWidth="1" opacity="0.2" />
          <path d="M1000 300 L800 400 L700 380" stroke="#a53b8b" strokeWidth="1" opacity="0.2" />
        </svg>
        
        {/* Floating music notes */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <div 
              key={i}
              className="absolute animate-float opacity-20"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `float ${10 + Math.random() * 20}s linear infinite`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            >
              {i % 4 === 0 ? (
                <Music2 className="h-3 w-3 text-[#107793]" />
              ) : i % 4 === 1 ? (
                <Volume2 className="h-4 w-4 text-[#a53b8b]" />
              ) : i % 4 === 2 ? (
                <Radio className="h-3 w-3 text-[#4a4f5b]" />
              ) : (
                <Headphones className="h-3 w-3 text-[#4CC9F0]" />
              )}
            </div>
          ))}
        </div>
        
        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.015] bg-gradient-to-r from-transparent via-white to-transparent mix-blend-overlay" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3Ccircle cx='27' cy='27' r='1'/%3E%3Ccircle cx='47' cy='47' r='1'/%3E%3Ccircle cx='17' cy='37' r='1'/%3E%3Ccircle cx='37' cy='17' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>
      
      <div className="relative z-10 h-screen flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-6 flex-shrink-0">
          <Button
            onClick={() => {
              soundEffects.playButtonClick();
              onBackToMenu();
            }}
            className="bg-[#0e1f2f]/60 hover:bg-[#0e1f2f]/80 border border-[#107793]/30 text-white h-10 px-4 text-sm font-medium 
                     rounded-xl backdrop-blur-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-[#107793]/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Menu
          </Button>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <img 
                src="/Vinyl_rythm.png" 
                alt="Rythmy Logo" 
                className="w-8 h-8 object-contain drop-shadow-lg"
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Party Setup
            </h1>
            <p className="text-[#d9e8dd] font-medium text-sm">Get ready to jam with friends</p>
          </div>
          
          <div className="w-24" />
        </div>

        <div className="flex-1 flex items-start justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl w-full max-h-full">
            
            {/* Left Column - Room Info & Controls */}
            <div className="space-y-4">
              
              {/* Room Code Card */}
              <Card className="bg-[#0e1f2f]/60 backdrop-blur-3xl border border-[#107793]/30 p-4 sm:p-6 rounded-3xl shadow-lg shadow-[#107793]/10 hover:bg-[#0e1f2f]/70 transition-all duration-500 hover:scale-[1.02]">
                <div className="text-center space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-2 tracking-tight">
                      Room Code
                    </h2>
                    <p className="text-[#d9e8dd] font-medium text-sm">Your crew needs this magic code</p>
                  </div>
                  
                  <div className="relative group">
                    <div className="bg-[#1A1A2E]/70 border border-[#4a4f5b]/30 text-white text-2xl sm:text-3xl font-bold font-mono px-4 py-3 rounded-2xl tracking-widest transition-all duration-300 group-hover:scale-105 shadow-lg backdrop-blur-sm">
                      {lobbyCode}
                    </div>
                    
                    <Button
                      onClick={copyToClipboard}
                      size="sm"
                      className="absolute -top-1 -right-1 bg-gradient-to-r from-[#107793] to-[#0e1f2f] hover:from-[#0e1f2f] hover:to-[#107793] text-white rounded-full w-10 h-10 p-0 shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 border-0"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  {/* QR Code */}
                  <div className="flex justify-center pt-2">
                    <QRCodeGenerator 
                      value={gameUrl}
                      size={140}
                      bgColor="#0e1f2f"
                      fgColor="#4CC9F0"
                      showLabels={false}
                      className="p-4 bg-[#0e1f2f]/80 border border-[#4CC9F0]/30 rounded-2xl shadow-lg transition-all duration-300 hover:scale-105 backdrop-blur-sm"
                    />
                  </div>
                  <p className="text-[#d9e8dd] font-medium text-xs">
                    Or scan this groovy code
                  </p>
                </div>
              </Card>

              {/* Game Mode Selection */}
              <Card className="bg-[#0e1f2f]/60 backdrop-blur-3xl border border-[#107793]/30 p-4 sm:p-6 rounded-3xl shadow-lg shadow-[#107793]/10 hover:bg-[#0e1f2f]/70 transition-all duration-500 hover:scale-[1.02]">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Gamepad2 className="h-5 w-5 text-[#a53b8b]" />
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      Game Mode
                    </h3>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="gamemode-select" className="text-[#d9e8dd] font-medium text-sm">
                      Choose your adventure
                    </Label>
                    <Select value={selectedGamemode} onValueChange={handleGamemodeChange}>
                      <SelectTrigger className="bg-[#1A1A2E]/70 border border-[#4a4f5b]/30 text-white rounded-xl h-12 transition-all duration-300 hover:bg-[#1A1A2E]/90">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A1A2E] border border-[#4a4f5b]/30 rounded-xl">
                        <SelectItem value="classic" className="text-white hover:bg-[#4a4f5b]/20 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Music2 className="h-4 w-4 text-[#4CC9F0]" />
                            <div>
                              <div className="font-semibold">Classic/Timeliner</div>
                              <div className="text-xs text-[#d9e8dd]/70">Place cards in timeline • First to 10 wins</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="fiend" className="text-white hover:bg-[#4a4f5b]/20 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Radio className="h-4 w-4 text-[#a53b8b]" />
                            <div>
                              <div className="font-semibold">Fiend Mode</div>
                              <div className="text-xs text-[#d9e8dd]/70">Guess the year on timeline • Score by accuracy</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="sprint" className="text-white hover:bg-[#4a4f5b]/20 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Timer className="h-4 w-4 text-[#107793]" />
                            <div>
                              <div className="font-semibold">Sprint Mode</div>
                              <div className="text-xs text-[#d9e8dd]/70">Simultaneous play • Race to target</div>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Game Mode Settings */}
                  {selectedGamemode === 'fiend' && (
                    <div className="space-y-3 pt-2 border-t border-[#4a4f5b]/20">
                      <Label className="text-[#d9e8dd] font-medium text-sm">Number of Rounds</Label>
                      <div className="space-y-2">
                        <Slider
                          value={[gamemodeSettings.rounds || 5]}
                          onValueChange={([value]) => handleSettingsChange('rounds', value)}
                          max={15}
                          min={3}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-[#d9e8dd]/70">
                          <span>3 rounds</span>
                          <span className="text-[#a53b8b] font-semibold">{gamemodeSettings.rounds || 5} rounds</span>
                          <span>15 rounds</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedGamemode === 'sprint' && (
                    <div className="space-y-3 pt-2 border-t border-[#4a4f5b]/20">
                      <Label className="text-[#d9e8dd] font-medium text-sm">Target Cards</Label>
                      <div className="space-y-2">
                        <Slider
                          value={[gamemodeSettings.targetCards || 10]}
                          onValueChange={([value]) => handleSettingsChange('targetCards', value)}
                          max={20}
                          min={5}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-[#d9e8dd]/70">
                          <span>5 cards</span>
                          <span className="text-[#107793] font-semibold">{gamemodeSettings.targetCards || 10} cards</span>
                          <span>20 cards</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedGamemode === 'classic' && (
                    <div className="bg-[#4CC9F0]/10 border border-[#4CC9F0]/30 rounded-2xl p-3 backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#4CC9F0] rounded-full animate-pulse" />
                        <div>
                          <div className="text-[#4CC9F0] font-bold tracking-tight text-sm">
                            The classic experience
                          </div>
                          <div className="text-[#d9e8dd] font-medium text-xs">
                            Build your timeline, first to 10 cards wins!
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Playlist Section */}
              <Card className="bg-[#0e1f2f]/60 backdrop-blur-3xl border border-[#107793]/30 p-4 rounded-3xl shadow-lg shadow-[#107793]/10 hover:bg-[#0e1f2f]/70 transition-all duration-500">
                <div className="flex items-center gap-3 mb-3">
                  <Music2 className="h-5 w-5 text-[#4CC9F0]" />
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    The Playlist
                  </h3>
                </div>
                
                <div className="bg-[#4CC9F0]/10 border border-[#4CC9F0]/30 rounded-2xl p-3 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#4CC9F0] rounded-full animate-pulse" />
                    <div>
                      <div className="text-[#4CC9F0] font-bold tracking-tight text-sm">
                        Default bangers loaded
                      </div>
                      <div className="text-[#d9e8dd] font-medium text-xs">
                        Mix of hits from every era
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 opacity-40 pointer-events-none">
                  <PlaylistLoader
                    onPlaylistLoaded={(success, count) => {
                      if (success) {
                        console.log(`Playlist loaded with ${count} songs`);
                      }
                    }}
                    setCustomSongs={setCustomSongs}
                    isDarkMode={true}
                  />
                </div>
                <p className="text-xs text-[#d9e8dd]/60 mt-2 font-medium">
                  Custom playlists dropping soon ✨
                </p>
              </Card>
            </div>

            {/* Right Column - Players */}
            <div className="flex flex-col">
              {/* Start Game Button - Moved to top */}
              <Button
                onClick={() => {
                  console.log('🎮 Starting game with players:', players);
                  soundEffects.playGameStart();
                  onStartGame();
                }}
                disabled={players.length < 1}
                className="w-full bg-gradient-to-r from-[#a53b8b] to-[#4a4f5b] text-white h-14 text-lg font-semibold rounded-xl transition-all duration-300 shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100 border-0 tracking-tight relative overflow-hidden group mb-4"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#a53b8b]/0 via-[#a53b8b]/10 to-[#a53b8b]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-x-full group-hover:translate-x-0"></div>
                <Play className="h-5 w-5 mr-2" />
                {players.length < 1 ? 'Waiting for the squad...' : 
                  `Start ${selectedGamemode === 'classic' ? 'Classic' : selectedGamemode === 'fiend' ? 'Fiend Mode' : 'Sprint Mode'}! (${players.length} ${players.length === 1 ? 'player' : 'players'})`}
              </Button>

              <Card className="bg-[#0e1f2f]/60 backdrop-blur-3xl border border-[#107793]/30 p-4 flex-1 rounded-3xl shadow-lg shadow-[#107793]/10 hover:bg-[#0e1f2f]/70 transition-all duration-500 min-h-0">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="h-5 w-5 text-[#4CC9F0]" />
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    The Squad ({players.length})
                  </h3>
                  {players.length > 0 && (
                    <div className="w-2 h-2 bg-[#4CC9F0] rounded-full animate-pulse" />
                  )}
                </div>
                
                <div className="space-y-2 overflow-y-auto flex-1">
                  {players.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-[#0e1f2f]/60 border-2 border-[#4a4f5b] rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#4a4f5b]/20 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#4a4f5b]/10 to-transparent"></div>
                        <Users className="h-6 w-6 text-[#4a4f5b]" />
                      </div>
                      <p className="text-white text-base font-bold mb-1 tracking-tight">
                        Waiting for friends
                      </p>
                      <p className="text-[#d9e8dd] font-medium text-sm">
                        Share that room code above!
                      </p>
                    </div>
                  ) : (
                    players.map((player, index) => {
                      const character = getCharacterById(player.character || getDefaultCharacter().id);
                      
                      return (
                        <div
                          key={player.id}
                          className="flex items-center gap-3 p-3 bg-[#1A1A2E]/50 border border-[#4a4f5b]/30 rounded-2xl transition-all duration-300 hover:bg-[#1A1A2E]/70 hover:scale-[1.02] shadow-md backdrop-blur-sm group"
                        >
                          <div className="text-base font-bold text-[#4CC9F0] tracking-tight">
                            {index + 1}
                          </div>
                          
                          {/* Character Icon */}
                          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/20 shadow-md">
                            <img
                              src={character?.image || getDefaultCharacter().image}
                              alt={character?.name || getDefaultCharacter().name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          <div className="flex-1">
                            <div className="text-white font-bold tracking-tight text-sm">
                              {player.name}
                            </div>
                            <div className="text-[#d9e8dd] text-xs font-medium">
                              Ready to jam • {character?.name || getDefaultCharacter().name}
                            </div>
                          </div>
                          
                          <div className="w-2 h-2 bg-[#4CC9F0] rounded-full animate-pulse" />
                          
                          {/* Kick Player Button */}
                          {onKickPlayer && (
                            <Button
                              onClick={() => handleKickPlayer(player.id, player.name)}
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 text-red-400 hover:text-red-300 w-7 h-7 p-0 rounded-full transition-all duration-200"
                              title={`Remove ${player.name}`}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Footer disclaimer */}
        <div className="p-4 text-center flex-shrink-0">
          <p className="text-[#d9e8dd]/70 text-xs font-medium max-w-md mx-auto">
            This groovy creation is just for friends to jam together • Not affiliated with any music service
          </p>
        </div>
      </div>
    </div>
  );
}
