
-- Drop the problematic RLS policies that cause infinite recursion
DROP POLICY IF EXISTS "Players can view players in their room" ON public.players;
DROP POLICY IF EXISTS "Players can view their own room" ON public.game_rooms;
DROP POLICY IF EXISTS "Players can create moves in their room" ON public.game_moves;
DROP POLICY IF EXISTS "Players can view moves in their room" ON public.game_moves;

-- Create new RLS policies that don't cause infinite recursion

-- For players table: Allow viewing players in the same room without self-referencing
CREATE POLICY "Players can view players in their room" ON public.players
FOR SELECT USING (
  room_id = get_player_room_id(current_setting('app.player_session_id', true))
);

-- For game_rooms table: Allow viewing rooms that the player belongs to
CREATE POLICY "Players can view their own room" ON public.game_rooms
FOR SELECT USING (
  id = get_player_room_id(current_setting('app.player_session_id', true))
);

-- For game_moves table: Allow creating moves in player's room
CREATE POLICY "Players can create moves in their room" ON public.game_moves
FOR INSERT WITH CHECK (
  player_belongs_to_room(current_setting('app.player_session_id', true), room_id)
);

-- For game_moves table: Allow viewing moves in player's room
CREATE POLICY "Players can view moves in their room" ON public.game_moves
FOR SELECT USING (
  room_id = get_player_room_id(current_setting('app.player_session_id', true))
);
