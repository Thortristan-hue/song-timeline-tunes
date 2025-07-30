import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// WebSocket connection handler for multiplayer game logic
serve(async (req) => {
  const upgrade = req.headers.get("upgrade") || ""
  
  if (upgrade.toLowerCase() != "websocket") {
    return new Response("Expected WebSocket connection", { status: 426 })
  }

  const { socket, response } = Deno.upgradeWebSocket(req)
  
  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  let roomId: string | null = null
  let isHost = false

  socket.onopen = () => {
    console.log("WebSocket connection opened")
  }

  socket.onmessage = async (event) => {
    try {
      const message = JSON.parse(event.data)
      console.log("Received message:", message)

      switch (message.type) {
        case 'JOIN_ROOM':
          await handleJoinRoom(message, socket, supabase)
          roomId = message.roomId
          break

        case 'HOST_SET_SONGS':
          await handleHostSetSongs(message, socket, supabase)
          break

        case 'PLAYER_ACTION':
          await handlePlayerAction(message, socket, supabase)
          break

        default:
          console.log("Unknown message type:", message.type)
      }
    } catch (error) {
      console.error("Error handling message:", error)
      socket.send(JSON.stringify({
        type: 'ERROR',
        error: error.message
      }))
    }
  }

  socket.onclose = () => {
    console.log("WebSocket connection closed")
  }

  socket.onerror = (error) => {
    console.error("WebSocket error:", error)
  }

  return response
})

// Handle room joining
async function handleJoinRoom(message: any, socket: WebSocket, supabase: any) {
  const { roomId, playerId, isHost: messageIsHost } = message
  
  try {
    // Verify room exists
    const { data: room, error } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('id', roomId)
      .single()

    if (error || !room) {
      socket.send(JSON.stringify({
        type: 'ERROR',
        error: 'Room not found'
      }))
      return
    }

    // Send room state to client
    socket.send(JSON.stringify({
      type: 'ROOM_JOINED',
      roomId,
      room
    }))

  } catch (error) {
    console.error("Error joining room:", error)
    socket.send(JSON.stringify({
      type: 'ERROR',
      error: error.message
    }))
  }
}

// Handle host setting songs and starting game
async function handleHostSetSongs(message: any, socket: WebSocket, supabase: any) {
  const { roomId, songs, playerId } = message
  
  try {
    // Update room with songs and start game
    const { error: updateError } = await supabase
      .from('game_rooms')
      .update({
        songs: songs,
        phase: 'playing',
        updated_at: new Date().toISOString()
      })
      .eq('id', roomId)

    if (updateError) throw updateError

    // Get all players for this room to set up turn order
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at')

    if (playersError) throw playersError

    if (players && players.length > 0) {
      // Set the first player as current player
      const firstPlayer = players[0]
      
      // Initialize each player's timeline with a starting card (first card from deck)
      const startingCards = songs.slice(0, players.length)
      
      for (let i = 0; i < players.length; i++) {
        const player = players[i]
        const startingCard = startingCards[i]
        
        await supabase
          .from('players')
          .update({
            timeline: [startingCard],
            updated_at: new Date().toISOString()
          })
          .eq('id', player.id)
      }

      // Set current player in room
      await supabase
        .from('game_rooms')
        .update({
          current_player_id: firstPlayer.id,
          current_turn: 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', roomId)

      // Set mystery song (next available song after starting cards)
      const mysteryCard = songs[players.length]
      await supabase
        .from('game_rooms')
        .update({
          current_song: mysteryCard,
          updated_at: new Date().toISOString()
        })
        .eq('id', roomId)

      // Broadcast game started to all clients
      broadcastToRoom(roomId, {
        type: 'GAME_STARTED',
        roomId,
        currentPlayerId: firstPlayer.id,
        currentSong: mysteryCard,
        players
      }, supabase)
    }

  } catch (error) {
    console.error("Error setting songs:", error)
    socket.send(JSON.stringify({
      type: 'ERROR',
      error: error.message
    }))
  }
}

// Handle player actions (like placing cards)
async function handlePlayerAction(message: any, socket: WebSocket, supabase: any) {
  const { roomId, playerId, action } = message
  
  try {
    if (action.type === 'PLACE_CARD') {
      await handlePlaceCard(roomId, playerId, action, socket, supabase)
    }
  } catch (error) {
    console.error("Error handling player action:", error)
    socket.send(JSON.stringify({
      type: 'ERROR',
      error: error.message
    }))
  }
}

// Handle card placement with server-side validation
async function handlePlaceCard(roomId: string, playerId: string, action: any, socket: WebSocket, supabase: any) {
  const { songToPlace, yearPlacedAfter } = action
  
  try {
    // Get current player's timeline
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('timeline')
      .eq('id', playerId)
      .single()

    if (playerError) throw playerError

    const timeline = player.timeline || []
    
    // Find the position to insert the card
    let insertIndex = 0
    let isCorrect = true
    
    if (yearPlacedAfter) {
      // Find the card that matches yearPlacedAfter
      const afterCardIndex = timeline.findIndex((card: any) => card.release_year === yearPlacedAfter)
      if (afterCardIndex >= 0) {
        insertIndex = afterCardIndex + 1
      }
    }

    // Validate placement
    const songYear = parseInt(songToPlace.release_year)
    
    // Check if card can be placed at this position
    if (insertIndex > 0) {
      const beforeCard = timeline[insertIndex - 1]
      const beforeYear = parseInt(beforeCard.release_year)
      if (songYear < beforeYear) {
        isCorrect = false
      }
    }
    
    if (insertIndex < timeline.length) {
      const afterCard = timeline[insertIndex]
      const afterYear = parseInt(afterCard.release_year)
      if (songYear > afterYear) {
        isCorrect = false
      }
    }

    if (isCorrect) {
      // Place the card in timeline
      const newTimeline = [...timeline]
      newTimeline.splice(insertIndex, 0, songToPlace)
      
      await supabase
        .from('players')
        .update({
          timeline: newTimeline,
          updated_at: new Date().toISOString()
        })
        .eq('id', playerId)

      // Broadcast successful placement
      broadcastToRoom(roomId, {
        type: 'CARD_PLACED',
        playerId,
        timeline: newTimeline,
        correct: true
      }, supabase)
    } else {
      // Card placement was incorrect - discard and move to next turn
      broadcastToRoom(roomId, {
        type: 'CARD_DISCARDED',
        playerId,
        songToPlace,
        correct: false
      }, supabase)
    }

    // Advance to next turn
    await advanceTurn(roomId, supabase)
    
  } catch (error) {
    console.error("Error placing card:", error)
    throw error
  }
}

// Advance turn to next player
async function advanceTurn(roomId: string, supabase: any) {
  try {
    // Get current room state
    const { data: room, error: roomError } = await supabase
      .from('game_rooms')
      .select('current_player_id, current_turn')
      .eq('id', roomId)
      .single()

    if (roomError) throw roomError

    // Get all players for this room
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at')

    if (playersError) throw playersError

    if (players && players.length > 0) {
      // Find current player index
      const currentPlayerIndex = players.findIndex(p => p.id === room.current_player_id)
      const nextPlayerIndex = (currentPlayerIndex + 1) % players.length
      const nextPlayer = players[nextPlayerIndex]

      // Update room with next player
      await supabase
        .from('game_rooms')
        .update({
          current_player_id: nextPlayer.id,
          current_turn: (room.current_turn || 1) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', roomId)

      // Broadcast turn change
      broadcastToRoom(roomId, {
        type: 'NEXT_TURN',
        roomId,
        newPlayerId: nextPlayer.id,
        currentTurn: (room.current_turn || 1) + 1
      }, supabase)
    }
  } catch (error) {
    console.error("Error advancing turn:", error)
    throw error
  }
}

// Broadcast message to all clients in a room
async function broadcastToRoom(roomId: string, message: any, supabase: any) {
  // For now, we'll use database updates to trigger realtime subscriptions
  // In a production system, you'd maintain WebSocket connections per room
  
  // Trigger a database update that clients can listen to
  await supabase
    .from('game_moves')
    .insert({
      room_id: roomId,
      player_id: message.playerId || 'system',
      move_type: message.type,
      move_data: message
    })
}