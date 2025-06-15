
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Palette } from "lucide-react";
import { timelineColors } from "@/pages/Index"; // We'll export this array
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
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        type="text"
        placeholder="Enter your name"
        value={name}
        onChange={e => setName(e.target.value)}
        className={cn(
          "flex-1 px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent",
          isDarkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "border-gray-200"
        )}
      />
      <div className="flex items-center gap-2">
        <Palette size={18} className={isDarkMode ? "text-gray-200" : "text-gray-600"} />
        <span className={cn("text-sm", isDarkMode ? "text-gray-200" : "text-gray-700")}>
          Timeline Color:
        </span>
        <div className="flex gap-1">
          {timelineColors.map((c) => (
            <button
              type="button"
              className={cn(
                "w-7 h-7 rounded shadow-sm border-2 focus:outline-none transition-all",
                color === c ? "ring-2 ring-purple-500 border-white scale-110" : "border-transparent"
              )}
              key={c}
              style={{ backgroundColor: c }}
              aria-label={c}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </div>
      <Button type="submit" className="px-6 py-3 mt-3 rounded-xl w-full">Join</Button>
    </form>
  );
}
