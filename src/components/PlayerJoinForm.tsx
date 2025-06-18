
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="playerName" className="text-sm font-medium text-white">
          Player Name
        </label>
        <Input
          id="playerName"
          type="text"
          placeholder="Enter your name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-purple-400 focus:ring-purple-400/20"
          maxLength={20}
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-2 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
        disabled={!name.trim()}
      >
        <Users className="mr-2 h-4 w-4" />
        Join the Beat
      </Button>
    </form>
  );
}
