-- Add character column to players table for character selection support
ALTER TABLE players 
ADD COLUMN character TEXT;

-- Update existing players to have a default character based on their position
UPDATE players 
SET character = CASE 
  WHEN ROW_NUMBER() OVER (ORDER BY joined_at) = 1 THEN 'char_player1'
  WHEN ROW_NUMBER() OVER (ORDER BY joined_at) = 2 THEN 'char_player2'
  WHEN ROW_NUMBER() OVER (ORDER BY joined_at) = 3 THEN 'char_player3'
  WHEN ROW_NUMBER() OVER (ORDER BY joined_at) = 4 THEN 'char_player4'
  WHEN ROW_NUMBER() OVER (ORDER BY joined_at) = 5 THEN 'char_player5'
  ELSE 'char_player6'
END
WHERE character IS NULL;