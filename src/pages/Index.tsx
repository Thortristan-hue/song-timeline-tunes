
import React from 'react';
import { MainMenu } from '@/components/MainMenu';
import { HostLobby } from '@/components/HostLobby';
import { MobileJoin } from '@/components/MobileJoin';
import MobilePlayerLobby from '@/components/MobilePlayerLobby';
import { GamePlay } from '@/components/GamePlay';
import { VictoryScreen } from '@/components/VictoryScreen';
import { EnhancedErrorBoundary } from '@/components/EnhancedErrorBoundary';
import { useGame } from '@/contexts/GameContext';
import { Song } from '@/types/game';

function Index() {
  const {
    state,
    room,
    players,
    currentPlayer,
    isHost,
    isLoading,
    error,
    createRoom,
    joinRoom,
    startGame,
    backToMenu,
    placeCard,
    updatePlayer,
    recordRender
  } = useGame();

  // Record render for performance monitoring
  recordRender();


  // Modern loading state
  if (isLoading && state.gamePhase !== 'menu') {
    return (
      <EnhancedErrorBoundary level="feature" name="Loading Screen">
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
          </div>
          <div className="text-center text-white relative z-10">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center mb-6 mx-auto border border-white/20">
              <div className="text-3xl animate-spin">🎵</div>
            </div>
            <div className="text-2xl font-semibold mb-2">Setting things up...</div>
            <div className="text-white/60 max-w-md mx-auto">Getting your music game experience ready</div>
          </div>
        </div>
      </EnhancedErrorBoundary>
    );
  }

  return (
    <EnhancedErrorBoundary level="app" name="Game Application">
      <div className="min-h-screen">
        {state.gamePhase === 'menu' && (
          <EnhancedErrorBoundary level="feature" name="Main Menu">
            <MainMenu
              onCreateRoom={createRoom}
              onJoinRoom={() => {/* Set phase handled in context */}}
            />
          </EnhancedErrorBoundary>
        )}

        {state.gamePhase === 'hostLobby' && (
          <EnhancedErrorBoundary level="feature" name="Host Lobby">
            <HostLobby
              lobbyCode={room?.lobby_code || ''}
              players={players}
              onStartGame={startGame}
              onBackToMenu={backToMenu}
              setCustomSongs={(songs: Song[]) => {/* Handle custom songs */}}
              isLoading={isLoading}
              createRoom={createRoom}
            />
          </EnhancedErrorBoundary>
        )}

        {state.gamePhase === 'mobileJoin' && (
          <EnhancedErrorBoundary level="feature" name="Mobile Join">
            <MobileJoin
              onJoinRoom={joinRoom}
              onBackToMenu={backToMenu}
              isLoading={isLoading}
            />
          </EnhancedErrorBoundary>
        )}

        {state.gamePhase === 'mobileLobby' && (
          <EnhancedErrorBoundary level="feature" name="Mobile Lobby">
            <MobilePlayerLobby
              room={room}
              players={players}
              currentPlayer={currentPlayer}
              onBackToMenu={backToMenu}
              onUpdatePlayer={updatePlayer}
            />
          </EnhancedErrorBoundary>
        )}

        {state.gamePhase === 'playing' && room && currentPlayer && (
          <EnhancedErrorBoundary level="feature" name="Game Play">
            <GamePlay
              room={room}
              players={players}
              currentPlayer={currentPlayer}
              isHost={isHost}
              onPlaceCard={placeCard}
              onSetCurrentSong={(song: Song) => Promise.resolve()}
              customSongs={state.customSongs}
            />
          </EnhancedErrorBoundary>
        )}

        {state.gamePhase === 'finished' && state.winner && (
          <EnhancedErrorBoundary level="feature" name="Victory Screen">
            <VictoryScreen
              winner={state.winner}
              players={players}
              onPlayAgain={() => {/* Handle play again */}}
              onBackToMenu={backToMenu}
            />
          </EnhancedErrorBoundary>
        )}

        {error && (
          <div className="fixed bottom-4 right-4 bg-red-500/90 text-white p-4 rounded-lg shadow-lg max-w-sm z-50">
            <div className="font-bold mb-1">Oops!</div>
            <div className="text-sm">{error}</div>
          </div>
        )}
      </div>
    </EnhancedErrorBoundary>
  );
}

export default Index;
