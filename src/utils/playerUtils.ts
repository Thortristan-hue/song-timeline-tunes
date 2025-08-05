import { Player } from '@/types/game';

/**
 * Filters out the host from the players list to get actual game players
 * @param players - Array of all players including potential host
 * @param hostId - Host session ID to filter out
 * @returns Array of actual game players (excluding host)
 */
export function getActualPlayers(players: Player[], hostId: string): Player[] {
  return players.filter(player => 
    (player as any).player_session_id !== hostId && 
    !(player as any).is_host
  );
}

/**
 * Checks if the minimum player count is met for starting a game
 * @param players - Array of all players
 * @param hostId - Host session ID
 * @param minPlayers - Minimum number of players required (default: 2)
 * @returns Boolean indicating if minimum players requirement is met
 */
export function hasMinimumPlayers(players: Player[], hostId: string, minPlayers: number = 2): boolean {
  const actualPlayers = getActualPlayers(players, hostId);
  return actualPlayers.length >= minPlayers;
}

/**
 * Gets the next player in turn rotation (excluding host)
 * @param players - Array of all players
 * @param currentPlayerId - Current player's ID
 * @param hostId - Host session ID to exclude
 * @returns Next player in rotation or null if no players
 */
export function getNextPlayer(players: Player[], currentPlayerId: string | null, hostId: string): Player | null {
  const actualPlayers = getActualPlayers(players, hostId);
  
  if (actualPlayers.length === 0) {
    return null;
  }

  // If no current player, start with first actual player
  if (!currentPlayerId) {
    return actualPlayers[0];
  }

  // Find current player index in actual players
  const currentIndex = actualPlayers.findIndex(player => 
    player.id === currentPlayerId || (player as any).player_session_id === currentPlayerId
  );

  // If current player not found or is last player, cycle to first
  if (currentIndex === -1 || currentIndex === actualPlayers.length - 1) {
    return actualPlayers[0];
  }

  // Return next player
  return actualPlayers[currentIndex + 1];
}