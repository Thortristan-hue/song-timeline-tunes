import React, { useState, useEffect } from 'react';
import { Player, Song } from '@/types/game';
import { getCharacterById } from '@/constants/characters';
import { audioEngine } from '@/utils/audioEngine';
import { DeezerAudioService } from '@/services/DeezerAudioService';

// Define the props for the component
interface HostCurrentPlayerTimelineProps {
  currentTurnPlayer: Player;
  cardPlacementResult: { correct: boolean; song: Song } | null;
  highlightedGapIndex: number | null;
  isTransitioning: boolean;
}

export function HostCurrentPlayerTimeline({ 
  currentTurnPlayer, 
  cardPlacementResult,
  highlightedGapIndex,
  isTransitioning
}: HostCurrentPlayerTimelineProps) {
  const [playingCardId, setPlayingCardId] = useState<string | null>(null);
  const [cardPreviewUrls, setCardPreviewUrls] = useState<Record<string, string>>({});
  const [loadingPreviews, setLoadingPreviews] = useState<Set<string>>(new Set());

  // Get player timeline with fallback
  const timeline = Array.isArray(currentTurnPlayer?.timeline) ? currentTurnPlayer.timeline as Song[] : [];
  const character = getCharacterById(currentTurnPlayer?.character || 'char_dave');

  // Fetch preview URLs for timeline cards
  useEffect(() => {
    const fetchPreviewUrls = async () => {
      for (const song of timeline) {
        if (!song.preview_url && !cardPreviewUrls[song.id] && !loadingPreviews.has(song.id)) {
          setLoadingPreviews(prev => new Set([...prev, song.id]));
          
          try {
            // Extract a mock Deezer ID from song data
            const mockTrackId = Math.abs(song.id.split('').reduce((a, b) => {
              a = ((a << 5) - a) + b.charCodeAt(0);
              return a & a;
            }, 0)) % 1000000;

            const previewUrl = await DeezerAudioService.getPreviewUrl(mockTrackId);
            setCardPreviewUrls(prev => ({ ...prev, [song.id]: previewUrl }));
            console.log('[HostCurrentPlayerTimeline] Preview URL fetched for card:', song.deezer_title);
          } catch (error) {
            console.warn('[HostCurrentPlayerTimeline] Failed to fetch preview for card:', song.deezer_title, error);
          } finally {
            setLoadingPreviews(prev => {
              const newSet = new Set(prev);
              newSet.delete(song.id);
              return newSet;
            });
          }
        }
      }
    };

    if (timeline.length > 0) {
      fetchPreviewUrls();
    }
  }, [timeline, cardPreviewUrls, loadingPreviews]);

  const handleCardClick = async (song: Song) => {
    const previewUrl = song.preview_url || cardPreviewUrls[song.id];
    
    if (!previewUrl) {
      console.warn('[HostCurrentPlayerTimeline] No preview URL available for card:', song.deezer_title);
      return;
    }

    try {
      if (playingCardId === song.id) {
        // Stop current preview
        audioEngine.stopPreview();
        setPlayingCardId(null);
      } else {
        // Stop any currently playing preview
        audioEngine.stopPreview();
        
        // Start new preview
        audioEngine.playPreview(previewUrl);
        setPlayingCardId(song.id);
        
        // Auto-stop after 30 seconds
        setTimeout(() => {
          setPlayingCardId(null);
        }, 30000);
      }
    } catch (error) {
      console.error('[HostCurrentPlayerTimeline] Error playing card preview:', error);
      setPlayingCardId(null);
    }
  };

  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      audioEngine.stopPreview();
      setPlayingCardId(null);
    };
  }, []);

  if (!currentTurnPlayer) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600">No current player</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl">
      {/* Player Info Header */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center gap-4 bg-white/20 backdrop-blur-sm rounded-lg p-4">
          {character ? (
            <img 
              src={character.image} 
              alt={character.name}
              className="w-12 h-12 object-contain"
            />
          ) : (
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: currentTurnPlayer.color }}
            >
              {currentTurnPlayer.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="text-xl font-bold text-gray-800">{currentTurnPlayer.name}</h3>
            <p className="text-gray-600">Score: {currentTurnPlayer.score || 0}</p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex items-center justify-center gap-6 overflow-x-auto pb-4">
        {timeline.length === 0 ? (
          <div className="text-gray-600 text-lg">No cards in timeline yet</div>
        ) : (
          timeline.map((song, index) => {
            const isPlaying = playingCardId === song.id;
            const hasPreview = !!(song.preview_url || cardPreviewUrls[song.id]);
            const isLoadingPreview = loadingPreviews.has(song.id);
            
            return (
              <div
                key={`${song.id}-${index}`}
                className={`
                  bg-white/90 rounded-lg p-4 min-w-[200px] shadow-lg transition-all duration-300
                  ${hasPreview ? 'cursor-pointer hover:bg-white hover:shadow-xl hover:scale-105' : 'cursor-default'}
                  ${isPlaying ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
                  ${cardPlacementResult?.song.id === song.id ? 
                    cardPlacementResult.correct ? 'ring-2 ring-green-500' : 'ring-2 ring-red-500' 
                    : ''}
                `}
                onClick={() => hasPreview && handleCardClick(song)}
              >
                <div className="space-y-2">
                  <div className="font-semibold text-gray-900 text-sm line-clamp-2">
                    {song.deezer_title || 'Unknown Title'}
                  </div>
                  <div className="text-gray-700 text-xs">
                    {song.deezer_artist || 'Unknown Artist'}
                  </div>
                  <div className="text-gray-600 text-xs">
                    {song.deezer_album || 'Unknown Album'}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xl font-bold text-blue-600 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                      {song.release_year || 'Unknown'}
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      {isLoadingPreview && (
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400 mr-1"></div>
                      )}
                      {isPlaying && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-1"></div>
                      )}
                      {hasPreview && !isLoadingPreview && (
                        <span>{isPlaying ? 'Playing...' : 'Click to play'}</span>
                      )}
                      {!hasPreview && !isLoadingPreview && (
                        <span>No preview</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Timeline Legend */}
      {timeline.length > 0 && (
        <div className="flex justify-center mt-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2">
            <div className="text-sm text-gray-700">
              Click on cards to preview songs • Timeline sorted by year: {timeline[0]?.release_year} - {timeline[timeline.length - 1]?.release_year}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
