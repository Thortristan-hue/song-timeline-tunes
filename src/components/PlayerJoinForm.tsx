
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Palette, Sparkles } from "lucide-react";
import { timelineColors } from "@/pages/Index";
import { cn } from "@/lib/utils";

interface PlayerJoinFormProps {
  onJoin: (name: string, color: string) => void;
  isDarkMode: boolean;
}

export default function PlayerJoinForm({ onJoin, isDarkMode }: PlayerJoinFormProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(timelineColors[0]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onJoin(name, color);
    setName('');
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Enter your stage name..."
        value={name}
        onChange={e => setName(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border-0 bg-white/20 backdrop-blur-sm text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white/30 transition-all duration-300"
      />
      
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-purple-300" />
          <span className="text-sm font-medium text-purple-200">
            Choose your vibe:
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {timelineColors.map((c) => (
            <button
              type="button"
              className={cn(
                "w-8 h-8 rounded-full shadow-lg border-2 focus:outline-none transition-all duration-300 hover:scale-110",
                color === c ? 
                  "ring-2 ring-white border-white scale-110 shadow-xl" : 
                  "border-white/30 hover:border-white/60"
              )}
              key={c}
              style={{ backgroundColor: c }}
              aria-label={c}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </div>
      
      <Button 
        type="submit" 
        className="w-full py-3 mt-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-300 shadow-xl font-bold"
      >
        Join the Rhythm
      </Button>
    </form>
  );
}
