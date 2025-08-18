-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can view moves" ON game_moves;
DROP POLICY IF EXISTS "Anyone can create moves" ON game_moves;
DROP POLICY IF EXISTS "Anyone can view game rooms" ON game_rooms;
DROP POLICY IF EXISTS "Anyone can create game rooms" ON game_rooms;
DROP POLICY IF EXISTS "Anyone can update game rooms" ON game_rooms;
DROP POLICY IF EXISTS "Anyone can view players" ON players;
DROP POLICY IF EXISTS "Anyone can create players" ON players;
DROP POLICY IF EXISTS "Anyone can update players" ON players;

-- Create a function to get player's room ID from session
CREATE OR REPLACE FUNCTION get_player_room_id(session_id text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT room_id FROM players WHERE player_session_id = session_id LIMIT 1;
$$;

-- Create a function to check if a player belongs to a room
CREATE OR REPLACE FUNCTION player_belongs_to_room(session_id text, target_room_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS(
    SELECT 1 FROM players 
    WHERE player_session_id = session_id 
    AND room_id = target_room_id
  );
$$;

-- Secure policies for game_rooms table
-- Allow viewing only rooms where the player belongs
CREATE POLICY "Players can view their own room"
ON game_rooms FOR SELECT
USING (
  id IN (
    SELECT room_id FROM players 
    WHERE player_session_id = current_setting('app.player_session_id', true)
  )
);

-- Allow creating rooms (for hosts)
CREATE POLICY "Anyone can create game rooms"
ON game_rooms FOR INSERT
WITH CHECK (true);

-- Allow updating only rooms where the player is the host
CREATE POLICY "Hosts can update their own rooms"
ON game_rooms FOR UPDATE
USING (
  host_id = current_setting('app.player_session_id', true)
);

-- Secure policies for players table
-- Allow viewing only players in the same room
CREATE POLICY "Players can view players in their room"
ON players FOR SELECT
USING (
  room_id IN (
    SELECT room_id FROM players 
    WHERE player_session_id = current_setting('app.player_session_id', true)
  )
);

-- Allow creating player records
CREATE POLICY "Anyone can create players"
ON players FOR INSERT
WITH CHECK (true);

-- Allow updating only own player record
CREATE POLICY "Players can update their own record"
ON players FOR UPDATE
USING (
  player_session_id = current_setting('app.player_session_id', true)
);

-- Secure policies for game_moves table
-- Allow viewing only moves in the same room
CREATE POLICY "Players can view moves in their room"
ON game_moves FOR SELECT
USING (
  room_id IN (
    SELECT room_id FROM players 
    WHERE player_session_id = current_setting('app.player_session_id', true)
  )
);

-- Allow creating moves only in rooms where the player belongs
CREATE POLICY "Players can create moves in their room"
ON game_moves FOR INSERT
WITH CHECK (
  player_belongs_to_room(current_setting('app.player_session_id', true), room_id)
);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_player_room_id(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION player_belongs_to_room(text, uuid) TO anon, authenticated;