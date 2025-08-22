-- Fix security warning: Set search_path for all functions to prevent search path injection attacks

-- Fix the generate_lobby_code function
CREATE OR REPLACE FUNCTION public.generate_lobby_code()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  code TEXT;
  exists_check BOOLEAN;
  words TEXT[] := ARRAY[
    'APPLE', 'TRACK', 'MUSIC', 'DANCE', 'PARTY', 'SOUND', 'BEATS', 'PIANO', 'DRUMS', 'VOICE',
    'STAGE', 'TEMPO', 'CHORD', 'BANDS', 'REMIX', 'VINYL', 'RADIO', 'SONGS', 'ALBUM', 'DISCO',
    'BLUES', 'SWING', 'FORTE', 'SHARP', 'MINOR', 'MAJOR', 'SCALE', 'NOTES', 'LYRIC', 'VERSE',
    'CHOIR', 'ORGAN', 'FLUTE', 'CELLO', 'TENOR', 'OPERA', 'ROOMS', 'TABLE', 'CHAIR', 'LIGHT',
    'HAPPY', 'SMILE', 'LAUGH', 'PEACE', 'DREAM', 'HOPE', 'MAGIC', 'POWER', 'FLAME', 'SPARK'
  ];
  random_word TEXT;
  random_digit INTEGER;
BEGIN
  LOOP
    -- Select a random word from the array (all words are 5 letters)
    random_word := words[1 + floor(random() * array_length(words, 1))::int];
    -- Generate a random digit (0-9)
    random_digit := floor(random() * 10)::int;
    -- Combine word and digit
    code := random_word || random_digit::text;
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM game_rooms WHERE lobby_code = code) INTO exists_check;
    
    -- If code doesn't exist, return it
    IF NOT exists_check THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$function$;

-- Fix the get_player_room_id function
CREATE OR REPLACE FUNCTION public.get_player_room_id(session_id text)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT room_id FROM players WHERE player_session_id = session_id LIMIT 1;
$function$;

-- Fix the player_belongs_to_room function  
CREATE OR REPLACE FUNCTION public.player_belongs_to_room(session_id text, target_room_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT EXISTS(
    SELECT 1 FROM players 
    WHERE player_session_id = session_id 
    AND room_id = target_room_id
  );
$function$;