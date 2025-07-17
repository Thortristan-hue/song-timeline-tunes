-- Update lobby code generation function to use only 5-letter words
CREATE OR REPLACE FUNCTION generate_lobby_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_check BOOLEAN;
  words TEXT[] := ARRAY[
    'APPLE', 'TRACK', 'MUSIC', 'DANCE', 'PARTY', 'SOUND', 'BEATS', 'PIANO', 'DRUMS', 'VOICE',
    'STAGE', 'TEMPO', 'CHORD', 'BANDS', 'REMIX', 'VINYL', 'RADIO', 'SONGS', 'ALBUM', 'DISCO',
    'BLUES', 'SWING', 'FORTE', 'SHARP', 'MINOR', 'MAJOR', 'SCALE', 'NOTES', 'LYRIC', 'VERSE',
    'CHOIR', 'ORGAN', 'FLUTE', 'CELLO', 'TENOR', 'OPERA'
  ];
  random_word TEXT;
  random_digit INTEGER;
BEGIN
  LOOP
    -- Select a random word from the array (all words are now 5 letters)
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
$$ LANGUAGE plpgsql;