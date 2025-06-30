import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users } from "lucide-react";

interface PlayerJoinFormProps {
  onJoin: (name: string) => void;
  isDarkMode: boolean;
}

export function PlayerJoinForm({ onJoin, isDarkMode }: PlayerJoinFormProps) {
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
        <p className="text-sm text-white/70 leading-relaxed max-w-md mx-auto">
          This is just a fun game for friends! We're not affiliated with any music streaming services or record labels. 
          It's a free project made for good times and good music.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <label htmlFor="playerName" className="block text-lg font-medium text-white/90 tracking-tight">
            What should we call you?
          </label>
          <Input
            id="playerName"
            type="text"
            placeholder="Your name here..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
            className="h-14 text-lg bg-white/5 border-0 rounded-2xl text-white placeholder:text-white/40 
                     focus:bg-white/10 focus:ring-2 focus:ring-white/20 transition-all duration-200
                     backdrop-blur-xl shadow-inner"
            maxLength={20}
          />
        </div>
        
        <Button 
          onClick={handleSubmit}
          className="w-full h-14 bg-white text-black hover:bg-white/90 
                   font-semibold text-lg rounded-2xl transition-all duration-200 
                   shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]
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
