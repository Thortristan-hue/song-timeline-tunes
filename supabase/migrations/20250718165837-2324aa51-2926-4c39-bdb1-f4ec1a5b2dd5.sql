-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.generate_lobby_code();

-- Create a proper lobby code generation function
-- Generates 5 random letters + 1 random digit (A-Z, 0-9)
CREATE OR REPLACE FUNCTION public.generate_lobby_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  letters text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  lobby_code text := '';
  i integer;
BEGIN
  -- Generate 5 random letters
  FOR i IN 1..5 LOOP
    lobby_code := lobby_code || substr(letters, floor(random() * 26)::integer + 1, 1);
  END LOOP;
  
  -- Add 1 random digit (0-9)
  lobby_code := lobby_code || floor(random() * 10)::text;
  
  RETURN lobby_code;
END;
$$;