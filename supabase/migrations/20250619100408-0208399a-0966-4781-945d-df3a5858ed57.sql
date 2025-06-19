
-- First, drop the policies that depend on host_id
DROP POLICY IF EXISTS "allow_room_updates" ON game_rooms;
DROP POLICY IF EXISTS "Anyone can update game rooms" ON game_rooms;

-- Change host_id from uuid to text to match our session-based approach
ALTER TABLE game_rooms ALTER COLUMN host_id TYPE text;

-- Recreate the policy (assuming it was for allowing updates)
CREATE POLICY "Anyone can update game rooms" 
  ON public.game_rooms 
  FOR UPDATE 
  USING (true);
