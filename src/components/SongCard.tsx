
import { Song } from '@/types/game';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SongCardProps {
  song: Song;
  isSelected?: boolean;
  isCorrect?: boolean;
  isIncorrect?: boolean;
  onClick?: () => void;
  className?: string;
}

export function SongCard({ 
  song, 
  isSelected = false, 
  isCorrect = false, 
  isIncorrect = false, 
  onClick, 
  className = '' 
}: SongCardProps) {
  const getCardColor = () => {
    if (isCorrect) return 'bg-green-500/20 border-green-500/40';
    if (isIncorrect) return 'bg-red-500/20 border-red-500/40';
    if (isSelected) return 'bg-blue-500/20 border-blue-500/40';
    return 'bg-white/5 border-white/10 hover:bg-white/10';
  };

  return (
    <Card
      className={`p-3 cursor-pointer transition-all duration-200 ${getCardColor()} ${className}`}
      onClick={onClick}
    >
      <div className="space-y-2">
        <div className="text-white font-medium text-sm truncate">
          {song.deezer_title}
        </div>
        <div className="text-white/70 text-xs truncate">
          {song.deezer_artist}
        </div>
        <div className="flex items-center justify-between">
          <Badge 
            variant="outline" 
            className="text-xs border-white/20 text-white/60"
          >
            {song.release_year}
          </Badge>
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: song.cardColor }}
          />
        </div>
      </div>
    </Card>
  );
}
