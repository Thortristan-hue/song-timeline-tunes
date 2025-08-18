import { Button } from "@/components/ui/button";
import { 
  Users, 
  Timer, 
  Target, 
  PlayCircle, 
  Trophy 
} from "lucide-react";
import { GameMode } from "@/types/game";
import { useGameContext } from "@/providers/GameProvider";

interface MainMenuProps {
  onStartHost: (gameMode: GameMode) => void;
  onJoin: () => void;
}

export function MainMenu({ onStartHost, onJoin }: MainMenuProps) {
  const { isDarkMode, toggleDarkMode } = useGameContext();

  return (
    <div className="space-y-8">
      {/* Disclaimer */}
      <div className="text-center space-y-2 mb-8">
        <p className="text-sm text-gray-400 leading-relaxed max-w-md mx-auto">
          This is just a fun game for friends! We're not affiliated with any music streaming services or record labels. 
          It's a free project made for good times and good music.
        </p>
      </div>

      {/* Host Game Options */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Host a Game</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Classic Mode */}
          <Button 
            onClick={() => onStartHost(GameMode.CLASSIC)}
            className="w-full h-24 bg-gradient-to-br from-yellow-500 to-yellow-700 text-white 
                     font-semibold text-lg rounded-2xl transition-all duration-300 
                     shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]
                     border-0 tracking-tight"
          >
            <Timer className="mr-3 h-6 w-6" />
            Classic Mode
          </Button>

          {/* Fiend Mode */}
          <Button 
            onClick={() => onStartHost(GameMode.FIEND)}
            className="w-full h-24 bg-gradient-to-br from-red-500 to-red-700 text-white 
                     font-semibold text-lg rounded-2xl transition-all duration-300 
                     shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]
                     border-0 tracking-tight"
          >
            <Target className="mr-3 h-6 w-6" />
            Fiend Mode
          </Button>

          {/* Sprint Mode */}
          <Button 
            onClick={() => onStartHost(GameMode.SPRINT)}
            className="w-full h-24 bg-gradient-to-br from-green-500 to-green-700 text-white 
                     font-semibold text-lg rounded-2xl transition-all duration-300 
                     shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]
                     border-0 tracking-tight"
          >
            <PlayCircle className="mr-3 h-6 w-6" />
            Sprint Mode
          </Button>

          {/* Victory Mode */}
          <Button 
            onClick={() => onStartHost(GameMode.CLASSIC)}
            className="w-full h-24 bg-gradient-to-br from-blue-500 to-blue-700 text-white 
                     font-semibold text-lg rounded-2xl transition-all duration-300 
                     shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]
                     border-0 tracking-tight opacity-50 cursor-not-allowed"
            disabled
          >
            <Trophy className="mr-3 h-6 w-6" />
            Victory Mode (Coming Soon)
          </Button>
        </div>
      </div>

      {/* Join Game */}
      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-white tracking-tight">Join a Game</h2>
        <Button 
          onClick={onJoin}
          className="w-full h-16 bg-white text-black hover:bg-gray-200 
                   font-semibold text-lg rounded-2xl transition-all duration-300 
                   shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]
                   border-0 tracking-tight"
        >
          <Users className="mr-3 h-5 w-5" />
          Join with Room Code
        </Button>
      </div>

      {/* Dark Mode Toggle */}
      <div className="flex items-center justify-center mt-8">
        <label htmlFor="darkModeToggle" className="inline-flex items-center cursor-pointer">
          <span className="mr-3 text-sm font-medium text-gray-300">Theme</span>
          <div className="relative">
            <input 
              type="checkbox" 
              id="darkModeToggle" 
              className="sr-only peer"
              checked={isDarkMode}
              onChange={toggleDarkMode}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
          </div>
          <span className="ml-3 text-sm font-medium text-gray-300">{isDarkMode ? 'Dark' : 'Light'}</span>
        </label>
      </div>
    </div>
  );
}
