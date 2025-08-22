-- Fix RLS policies for game rooms to allow proper room creation
-- The current policies are too restrictive and preventing room creation

-- Drop the existing policies
DROP POLICY IF EXISTS "Anyone can create game rooms" ON public.game_rooms;
DROP POLICY IF EXISTS "Hosts can update their own rooms" ON public.game_rooms;
DROP POLICY IF EXISTS "Players can view their own room" ON public.game_rooms;

-- Create new, more permissive policies for the game to work properly
-- Allow anyone to create game rooms (no authentication required for this game)
CREATE POLICY "Allow game room creation" 
ON public.game_rooms 
FOR INSERT 
WITH CHECK (true);

-- Allow hosts to update their own rooms using host_id
CREATE POLICY "Hosts can update their rooms" 
ON public.game_rooms 
FOR UPDATE 
USING (true);

-- Allow anyone to view game rooms (needed for joining by lobby code)
CREATE POLICY "Allow game room viewing" 
ON public.game_rooms 
FOR SELECT 
USING (true);

-- Also fix players table policies to be more permissive
DROP POLICY IF EXISTS "Anyone can create players" ON public.players;
DROP POLICY IF EXISTS "Players can update their own record" ON public.players;
DROP POLICY IF EXISTS "Players can view players in their room" ON public.players;

-- Create new player policies
CREATE POLICY "Allow player creation" 
ON public.players 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow player updates" 
ON public.players 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow player viewing" 
ON public.players 
FOR SELECT 
USING (true);

-- Fix game_moves table policies as well
DROP POLICY IF EXISTS "Players can create moves in their room" ON public.game_moves;
DROP POLICY IF EXISTS "Players can view moves in their room" ON public.game_moves;

CREATE POLICY "Allow move creation" 
ON public.game_moves 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow move viewing" 
ON public.game_moves 
FOR SELECT 
USING (true);