import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../integrations/supabase/client";
import { Player, Song, Room } from "../types/types";

// Utility to generate session/lobby codes (replace with your logic if needed)
function generateSessionId() {
  return Math.random().toString(36).substr(2, 9);
}
function generateLobbyCode() {
  return Math.random().toString(36).substr(2, 5).toUpperCase();
}

export function useGameRoom(initialRoom?: Room) {
  const [room, setRoom] = useState<Room | null>(initialRoom ?? null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);

  const playerSessionId = useRef<string | null>(null);
  const hostSessionId = useRef<string | null>(null);

  // Reconnection state
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  // Convert DB player to Player type
  const convertPlayer = useCallback((dbPlayer: any): Player => {
    return {
      id: dbPlayer.id,
      name: dbPlayer.name,
      color: dbPlayer.color,
      timelineColor: dbPlayer.timeline_color,
      score: dbPlayer.score || 0,
      timeline: Array.isArray(dbPlayer.timeline)
        ? (dbPlayer.timeline as Song[])
        : [],
    };
  }, []);

  // Fetch all non-host players
  const fetchPlayers = useCallback(
    async (roomId: string) => {
      try {
        const { data, error } = await supabase
          .from("players")
          .select("*")
          .eq("room_id", roomId)
          .order("joined_at", { ascending: true });

        if (error) throw error;

        const nonHostPlayers = (data ?? []).filter(
          (p: any) => !p.is_host
        );
        const convertedPlayers = nonHostPlayers.map(convertPlayer);

        setPlayers(convertedPlayers);

        if (playerSessionId.current && !isHost) {
          const current = convertedPlayers.find(
            (p) =>
              (data ?? []).find(
                (dbP: any) =>
                  dbP.id === p.id &&
                  dbP.player_session_id === playerSessionId.current
              )
          );
          if (current) setCurrentPlayer(current);
        }
      } catch (error) {
        setError("Failed to fetch players.");
      }
    },
    [convertPlayer, isHost]
  );

  // Setup real-time subscriptions with auto-reconnect
  const setupSubscription = useCallback(() => {
    if (!room?.id) return;

    const channel = supabase
      .channel(`room-${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_rooms",
          filter: `id=eq.${room.id}`,
        },
        (payload) => {
          const roomData = payload.new as any;
          let currentSong: Song | null = null;
          if (roomData.current_song) {
            currentSong = roomData.current_song as Song;
          }
          setRoom({
            ...(roomData as Room),
            current_song: currentSong,
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `room_id=eq.${room.id}`,
        },
        () => {
          fetchPlayers(room.id);
        }
      )
      .subscribe((status: any) => {
        if (status === "SUBSCRIBED") {
          reconnectAttempts.current = 0;
        }
        if (
          status === "CLOSED" ||
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT"
        ) {
          attemptReconnect();
        }
      });

    function attemptReconnect() {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);

      reconnectAttempts.current += 1;
      const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 30000);
      reconnectTimeout.current = setTimeout(() => {
        setupSubscription();
      }, delay);
    }

    fetchPlayers(room.id);

    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      channel.unsubscribe();
    };
  }, [room?.id, fetchPlayers]);

  useEffect(() => {
    const cleanup = setupSubscription();
    return () => {
      if (cleanup) cleanup();
    };
  }, [setupSubscription]);

  // Create a room (host only)
  const createRoom = useCallback(
    async (hostName: string): Promise<string | null> => {
      try {
        setIsLoading(true);
        setError(null);

        const sessionId = generateSessionId();
        const lobbyCode = generateLobbyCode();
        hostSessionId.current = sessionId;

        const { data, error } = await supabase
          .from("game_rooms")
          .insert({
            lobby_code: lobbyCode,
            host_id: sessionId,
            host_name: hostName,
            phase: "lobby",
          })
          .select()
          .single();

        if (error) throw error;
        setRoom(data as Room);
        setIsHost(true);
        setIsLoading(false);
        return lobbyCode;
      } catch (error) {
        setError("Failed to create room.");
        setIsLoading(false);
        return null;
      }
    },
    []
  );

  // Update player info
  const updatePlayer = useCallback(
    async (updates: Partial<Player>) => {
      if (!currentPlayer) return false;
      try {
        const { error } = await supabase
          .from("players")
          .update(updates)
          .eq("id", currentPlayer.id);
        if (error) throw error;
        setCurrentPlayer((prev) => (prev ? { ...prev, ...updates } : null));
        return true;
      } catch {
        return false;
      }
    },
    [currentPlayer]
  );

  // Update room songs (host only)
  const updateRoomSongs = useCallback(
    async (songs: Song[]): Promise<boolean> => {
      if (!room || !isHost) return false;
      try {
        const { error } = await supabase
          .from("game_rooms")
          .update({ songs: songs as any })
          .eq("id", room.id);

        if (error) throw error;
        return true;
      } catch {
        return false;
      }
    },
    [room, isHost]
  );

  // Start the game (host only)
  const startGame = useCallback(async (): Promise<boolean> => {
    if (!room || !isHost) return false;
    try {
      const { error } = await supabase
        .from("game_rooms")
        .update({ phase: "playing" })
        .eq("id", room.id);
      if (error) throw error;
      return true;
    } catch {
      return false;
    }
  }, [room, isHost]);

  return {
    room,
    players,
    currentPlayer,
    isLoading,
    error,
    isHost,
    createRoom,
    updatePlayer,
    updateRoomSongs,
    startGame,
    fetchPlayers,
    setRoom,
    setCurrentPlayer,
    setPlayers,
  };
}
