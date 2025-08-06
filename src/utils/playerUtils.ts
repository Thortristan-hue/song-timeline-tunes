
import { Player } from '@/types/game';

export function getActualPlayers(players: Player[], hostId?: string): Player[] {
  if (!players || !Array.isArray(players)) {
    console.warn('getActualPlayers: Invalid players array provided');
    return [];
  }

  // Filter out host players - check both id and any host-like identifiers
  const actualPlayers = players.filter(player => {
    if (!player || !player.id) {
      return false;
    }
    
    // Filter out host by ID
    if (hostId && player.id === hostId) {
      return false;
    }
    
    // Filter out any player IDs that look like host IDs
    if (player.id.includes('host-') || player.id.startsWith('host_')) {
      return false;
    }
    
    return true;
  });

  console.log(`getActualPlayers: Filtered ${players.length} players to ${actualPlayers.length} actual players`);
  return actualPlayers;
}

export function findCurrentPlayer(players: Player[], currentPlayerId?: string, currentTurnIndex: number = 0): Player | null {
  if (!players || players.length === 0) {
    return null;
  }

  // First try to find by ID
  if (currentPlayerId) {
    const playerById = players.find(p => p.id === currentPlayerId);
    if (playerById) {
      return playerById;
    }
  }

  // Fallback to index-based selection
  const validIndex = Math.min(Math.max(currentTurnIndex, 0), players.length - 1);
  return players[validIndex] || players[0] || null;
}
