
-- Add missing gamemode columns to game_rooms table
ALTER TABLE public.game_rooms 
ADD COLUMN IF NOT EXISTS gamemode TEXT DEFAULT 'classic',
ADD COLUMN IF NOT EXISTS gamemode_settings JSONB DEFAULT '{}'::jsonb;

-- Update existing rows to have default values
UPDATE public.game_rooms 
SET gamemode = 'classic', gamemode_settings = '{}'::jsonb 
WHERE gamemode IS NULL OR gamemode_settings IS NULL;
