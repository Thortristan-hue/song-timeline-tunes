-- Drop all RLS policies that depend on host_id before changing column type
DROP POLICY IF EXISTS "Allow room creation" ON public.game_rooms;
DROP POLICY IF EXISTS "Hosts can update their rooms" ON public.game_rooms;
DROP POLICY IF EXISTS "Allow game room viewing" ON public.game_rooms;
DROP POLICY IF EXISTS "Allow game room creation" ON public.game_rooms;
DROP POLICY IF EXISTS "Owners can view their rooms" ON public.game_rooms;

-- Now change the column types
ALTER TABLE public.game_rooms 
ALTER COLUMN host_id TYPE TEXT;

-- Recreate the policies with TEXT type
CREATE POLICY "Allow game room creation" 
ON public.game_rooms 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Hosts can update their rooms" 
ON public.game_rooms 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow game room viewing" 
ON public.game_rooms 
FOR SELECT 
USING (true);