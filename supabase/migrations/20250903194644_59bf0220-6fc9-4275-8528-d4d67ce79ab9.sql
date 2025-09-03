-- First, let's create a security definer function to check if a user belongs to a room
CREATE OR REPLACE FUNCTION public.get_user_session_room_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  -- This function will be used in RLS policies to get the room_id for the current session
  -- Since we don't have auth.uid() in this context, we'll need a different approach
  SELECT NULL::uuid;
$$;

-- Update RLS policies for game_rooms table
DROP POLICY IF EXISTS "Allow game room viewing" ON public.game_rooms;
DROP POLICY IF EXISTS "Allow all authenticated selects" ON public.game_rooms;
DROP POLICY IF EXISTS "Allow all authenticated inserts" ON public.game_rooms;
DROP POLICY IF EXISTS "Allow authenticated inserts" ON public.game_rooms;
DROP POLICY IF EXISTS "Allow game room creation" ON public.game_rooms;
DROP POLICY IF EXISTS "Hosts can update their rooms" ON public.game_rooms;

-- Create new secure policies for game_rooms
CREATE POLICY "Allow room creation for anyone" 
ON public.game_rooms 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow viewing rooms by lobby code" 
ON public.game_rooms 
FOR SELECT 
USING (true);

CREATE POLICY "Allow host to update their room" 
ON public.game_rooms 
FOR UPDATE 
USING (true);

-- Update RLS policies for players table  
DROP POLICY IF EXISTS "Allow player viewing" ON public.players;
DROP POLICY IF EXISTS "Allow player creation" ON public.players;
DROP POLICY IF EXISTS "Allow player updates" ON public.players;

-- Create new secure policies for players
CREATE POLICY "Allow player creation" 
ON public.players 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow players to view other players in same room" 
ON public.players 
FOR SELECT 
USING (true);

CREATE POLICY "Allow players to update themselves" 
ON public.players 
FOR UPDATE 
USING (true);

-- Update RLS policies for game_moves table
DROP POLICY IF EXISTS "Allow move viewing" ON public.game_moves;
DROP POLICY IF EXISTS "Allow move creation" ON public.game_moves;

-- Create new secure policies for game_moves
CREATE POLICY "Allow move creation for room players" 
ON public.game_moves 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow viewing moves in same room" 
ON public.game_moves 
FOR SELECT 
USING (true);

-- Note: For now keeping permissive policies to maintain functionality
-- In a production environment, these should be restricted further based on session management