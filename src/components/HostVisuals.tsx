export function HostGameView({
  currentTurnPlayer,
  previousPlayer,
  currentSong,
  roomCode,
  players,
  mysteryCardRevealed,
  isPlaying,
  onPlayPause,
  cardPlacementResult,
  transitioning
}: {
  currentTurnPlayer: Player;
  previousPlayer?: Player;
  currentSong: Song | null;
  roomCode: string;
  players: Player[];
  mysteryCardRevealed: boolean;
  isPlaying: boolean;
  onPlayPause: () => void;
  cardPlacementResult: { correct: boolean; song: Song } | null;
  transitioning: boolean;
}) {
  const [displayedPlayer, setDisplayedPlayer] = useState(currentTurnPlayer);
  const [animationStage, setAnimationStage] = useState<'idle' | 'exiting' | 'entering'>('idle');
  
  useEffect(() => {
    if (transitioning) {
      setAnimationStage('exiting');
      setTimeout(() => {
        setDisplayedPlayer(currentTurnPlayer);
        setAnimationStage('entering');
        setTimeout(() => setAnimationStage('idle'), 1000);
      }, 800);
    } else {
      setDisplayedPlayer(currentTurnPlayer);
    }
  }, [currentTurnPlayer, transitioning]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-orange-50 to-yellow-50 relative overflow-hidden">
      <HostGameBackground />
      <HostHeader roomCode={roomCode} playersCount={players.length} />
      <RecordPlayerSection 
        currentSong={currentSong}
        mysteryCardRevealed={mysteryCardRevealed}
        isPlaying={isPlaying}
        onPlayPause={onPlayPause}
        cardPlacementResult={cardPlacementResult}
      />
      
      <div className="absolute top-1/2 left-0 right-0 z-30 mt-4">
        <div className="flex justify-center">
          <HostTimelineDisplay 
            currentPlayer={displayedPlayer} 
            isActive={animationStage !== 'exiting'}
            placementResult={cardPlacementResult}
          />
        </div>
      </div>

      <div className="absolute bottom-4 left-4 right-4 z-10">
        <CassettePlayerDisplay 
          players={players} 
          currentPlayerId={currentTurnPlayer.id}
        />
      </div>

      {cardPlacementResult && (
        <div className="fixed inset-0 bg-orange-900/80 backdrop-blur-2xl flex items-center justify-center z-50">
          <div className="text-center space-y-8 p-8">
            <div className={`text-9xl mb-6 ${
              cardPlacementResult.correct ? 'animate-bounce' : 'animate-pulse'
            }`}>
              {cardPlacementResult.correct ? '🎯' : '💫'}
            </div>
            <div className={`text-6xl font-black tracking-tight transform -rotate-1 ${
              cardPlacementResult.correct ? 
              'text-orange-500' : 
              'text-orange-400'
            }`} style={{ fontFamily: 'Comic Sans MS, cursive, sans-serif' }}>
              {cardPlacementResult.correct ? 'PERFECT MATCH!' : 'NICE TRY!'}
            </div>
            <div className="bg-orange-200/90 backdrop-blur-3xl rounded-3xl p-8 border-4 border-orange-400 max-w-lg shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="text-3xl font-bold text-orange-900 mb-3" style={{ fontFamily: 'Comic Sans MS, cursive, sans-serif' }}>
                {cardPlacementResult.song.deezer_title}
              </div>
              <div className="text-2xl text-orange-800 mb-6 font-medium">
                by {cardPlacementResult.song.deezer_artist}
              </div>
              <div className="inline-block bg-orange-500 text-white px-6 py-3 rounded-full font-bold text-2xl border-4 border-orange-600 shadow-lg">
                {cardPlacementResult.song.release_year}
              </div>
            </div>
            <div className="text-orange-200 text-xl font-medium" style={{ fontFamily: 'Comic Sans MS, cursive, sans-serif' }}>
              {cardPlacementResult.correct ? 
                `${currentTurnPlayer.name} scored a point!` : 
                `Better luck next time, ${currentTurnPlayer.name}!`
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
