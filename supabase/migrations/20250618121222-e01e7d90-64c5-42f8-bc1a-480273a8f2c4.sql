
-- Create game rooms table
CREATE TABLE public.game_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lobby_code TEXT NOT NULL UNIQUE,
  host_id TEXT NOT NULL,
  phase TEXT NOT NULL DEFAULT 'lobby' CHECK (phase IN ('lobby', 'playing', 'finished')),
  current_turn INTEGER DEFAULT 0,
  current_song_index INTEGER DEFAULT 0,
  songs JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create players table
CREATE TABLE public.players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.game_rooms(id) ON DELETE CASCADE NOT NULL,
  player_session_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  timeline_color TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  timeline JSONB DEFAULT '[]'::jsonb,
  is_host BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_active TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create game moves table for tracking player moves
CREATE TABLE public.game_moves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.game_rooms(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE NOT NULL,
  move_data JSONB NOT NULL,
  move_type TEXT NOT NULL CHECK (move_type IN ('card_placement', 'turn_end')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_moves ENABLE ROW LEVEL SECURITY;

-- RLS policies for game_rooms (allow public access for now to test)
CREATE POLICY "Anyone can view game rooms" 
  ON public.game_rooms 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can create game rooms" 
  ON public.game_rooms 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can update game rooms" 
  ON public.game_rooms 
  FOR UPDATE 
  USING (true);

-- RLS policies for players (allow public access for now to test)
CREATE POLICY "Anyone can view players" 
  ON public.players 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can create players" 
  ON public.players 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can update players" 
  ON public.players 
  FOR UPDATE 
  USING (true);

-- RLS policies for game_moves (allow public access for now to test)
CREATE POLICY "Anyone can view moves" 
  ON public.game_moves 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can create moves" 
  ON public.game_moves 
  FOR INSERT 
  WITH CHECK (true);

-- Enable real-time subscriptions
ALTER TABLE public.game_rooms REPLICA IDENTITY FULL;
ALTER TABLE public.players REPLICA IDENTITY FULL;
ALTER TABLE public.game_moves REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_moves;

-- Create indexes for better performance
CREATE INDEX idx_game_rooms_lobby_code ON public.game_rooms(lobby_code);
CREATE INDEX idx_players_room_id ON public.players(room_id);
CREATE INDEX idx_game_moves_room_id ON public.game_moves(room_id);

-- Function to generate unique lobby codes (5-letter word + digit format)
CREATE OR REPLACE FUNCTION generate_lobby_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_check BOOLEAN;
  words TEXT[] := ARRAY[
    'APPLE', 'TRACK', 'MUSIC', 'DANCE', 'PARTY', 'SOUND', 'BEATS', 'PIANO', 'DRUMS', 'VOICE',
    'STAGE', 'TEMPO', 'CHORD', 'BANDS', 'REMIX', 'VINYL', 'RADIO', 'SONGS', 'ALBUM', 'DISCO',
    'BLUES', 'SWING', 'FORTE', 'SHARP', 'MINOR', 'MAJOR', 'SCALE', 'NOTES', 'LYRIC', 'VERSE',
    'CHOIR', 'ORGAN', 'FLUTE', 'HARP', 'CELLO', 'BASS', 'TENOR', 'OPERA', 'JAZZ', 'FOLK',
    'METAL', 'PUNK', 'ROCK', 'POP', 'SOUL', 'FUNK', 'RAP', 'BEAT', 'DROP', 'WAVE'
  ];
  random_word TEXT;
  random_digit INTEGER;
BEGIN
  LOOP
    -- Select a random word from the array
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

-- Function to clean up old rooms (optional, for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_rooms()
RETURNS void AS $$
BEGIN
  DELETE FROM game_rooms 
  WHERE created_at < NOW() - INTERVAL '24 hours' 
  AND phase = 'lobby';
END;
$$ LANGUAGE plpgsql;
