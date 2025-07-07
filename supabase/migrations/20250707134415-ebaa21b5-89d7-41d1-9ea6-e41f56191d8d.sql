
-- Drop the existing restrictive policies
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.game_rooms;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.game_rooms;
DROP POLICY IF EXISTS "Anyone can update game rooms" ON public.game_rooms;

-- Create new permissive policies that allow public access
CREATE POLICY "Anyone can create game rooms" 
  ON public.game_rooms 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can view game rooms" 
  ON public.game_rooms 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can update game rooms" 
  ON public.game_rooms 
  FOR UPDATE 
  USING (true);

-- Also ensure the players table allows public access
DROP POLICY IF EXISTS "Anyone can create players" ON public.players;
DROP POLICY IF EXISTS "Anyone can view players" ON public.players;
DROP POLICY IF EXISTS "Anyone can update players" ON public.players;

CREATE POLICY "Anyone can create players" 
  ON public.players 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can view players" 
  ON public.players 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can update players" 
  ON public.players 
  FOR UPDATE 
  USING (true);
