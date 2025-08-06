import { Player } from '@/types/game';

export function getActualPlayers(players: Player[], hostId?: string): Player[] {
  if (!players || !Array.isArray(players)) {
    console.warn('[getActualPlayers] Invalid players array provided');
    return [];
  }

  // Filter out host players - check both id and any host-like identifiers
  const actualPlayers = players.filter(player => {
    if (!player || !player.id) {
      console.warn('[getActualPlayers] Invalid player object:', player);
      return false;
    }
    
    // Filter out host by ID
    if (hostId && player.id === hostId) {
      console.log('[getActualPlayers] Filtering out host player by ID:', player.id);
      return false;
    }
    
    // Filter out any player IDs that look like host IDs
    if (player.id.includes('host-') || player.id.startsWith('host_')) {
      console.log('[getActualPlayers] Filtering out host-like player ID:', player.id);
      return false;
    }
    
    return true;
  });

  console.log(`[getActualPlayers] Filtered ${players.length} players to ${actualPlayers.length} actual players`);
  console.log('[getActualPlayers] Actual players:', actualPlayers.map(p => ({ id: p.id, name: p.name })));
  
  return actualPlayers;
}

export function findCurrentPlayer(players: Player[], currentPlayerId?: string, currentTurnIndex: number = 0): Player | null {
  if (!players || players.length === 0) {
    console.warn('[findCurrentPlayer] No players available');
    return null;
  }

  console.log('[findCurrentPlayer] Searching with:', {
    playersCount: players.length,
    currentPlayerId,
    currentTurnIndex,
    playerIds: players.map(p => p.id)
  });

  // First try to find by ID
  if (currentPlayerId) {
    const playerById = players.find(p => p.id === currentPlayerId);
    if (playerById) {
      console.log('[findCurrentPlayer] Found player by ID:', playerById.name);
      return playerById;
    } else {
      console.warn('[findCurrentPlayer] Player ID not found in players list:', currentPlayerId);
    }
  }

  // Fallback to index-based selection
  const validIndex = Math.min(Math.max(currentTurnIndex, 0), players.length - 1);
  const fallbackPlayer = players[validIndex] || players[0] || null;
  
  if (fallbackPlayer) {
    console.log('[findCurrentPlayer] Using fallback player at index', validIndex, ':', fallbackPlayer.name);
  } else {
    console.warn('[findCurrentPlayer] No fallback player available');
  }
  
  return fallbackPlayer;
}

export function hasMinimumPlayers(players: Player[], minPlayers: number = 2): boolean {
  const actualPlayers = getActualPlayers(players);
  return actualPlayers.length >= minPlayers;
}

export function getNextPlayer(players: Player[], currentPlayerId?: string): Player | null {
  const actualPlayers = getActualPlayers(players);
  
  if (actualPlayers.length === 0) {
    return null;
  }
  
  if (!currentPlayerId) {
    return actualPlayers[0] || null;
  }
  
  const currentIndex = actualPlayers.findIndex(p => p.id === currentPlayerId);
  
  if (currentIndex === -1) {
    return actualPlayers[0] || null;
  }
  
  // Get next player (circular)
  const nextIndex = (currentIndex + 1) % actualPlayers.length;
  return actualPlayers[nextIndex] || null;
}
