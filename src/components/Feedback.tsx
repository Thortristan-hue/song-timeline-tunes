
import { Song } from '@/types/game';
import { CheckCircle, XCircle } from 'lucide-react';

interface FeedbackProps {
  correct: boolean;
  song: Song | null;
}

export function Feedback({ correct, song }: FeedbackProps) {
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-down">
      <div className="bg-gray-800 border border-gray-700 px-6 py-4 rounded-lg shadow-lg">
        <div className="flex items-center gap-3">
          {correct ? (
            <CheckCircle className="h-6 w-6 text-green-500" />
          ) : (
            <XCircle className="h-6 w-6 text-red-500" />
          )}
          <div>
            <div className={`font-semibold ${correct ? 'text-green-500' : 'text-red-500'}`}>
              {correct ? 'Correct!' : 'Wrong!'}
            </div>
            {song && (
              <div className="text-gray-300 text-sm">
                {song.deezer_title} - {song.deezer_artist}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
