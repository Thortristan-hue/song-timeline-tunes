
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users } from "lucide-react";

interface PlayerJoinFormProps {
  onJoin: (name: string) => void;
}

export function PlayerJoinForm({ onJoin }: PlayerJoinFormProps) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onJoin(name.trim());
      setName("");
    }
  };

  return (
    <div className="space-y-8">
      {/* Disclaimer */}
      <div className="text-center space-y-2 mb-8">
        <p className="text-sm text-gray-400 leading-relaxed max-w-md mx-auto">
          This is just a fun game for friends! We're not affiliated with any music streaming services or record labels. 
          It's a free project made for good times and good music.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <label htmlFor="playerName" className="block text-lg font-medium text-white tracking-tight">
            What should we call you?
          </label>
          <Input
            id="playerName"
            type="text"
            placeholder="Your name here..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
            className="h-16 text-lg bg-gray-800 border-gray-600 rounded-2xl text-white placeholder:text-gray-500 
                     focus:bg-gray-700 focus:ring-2 focus:ring-gray-500 transition-all duration-300
                     shadow-lg hover:bg-gray-700 hover:scale-[1.02] focus:scale-[1.02]"
            maxLength={20}
          />
        </div>
        
        <Button 
          onClick={handleSubmit}
          className="w-full h-16 bg-white text-black hover:bg-gray-200 
                   font-semibold text-lg rounded-2xl transition-all duration-300 
                   shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]
                   border-0 tracking-tight"
          disabled={!name.trim()}
        >
          <Users className="mr-3 h-5 w-5" />
          Join the Game
        </Button>
      </div>
    </div>
  );
}
