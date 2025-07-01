
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
      <div className="text-center space-y-2 mb-8 animate-fade-in">
        <p className="text-sm text-white/70 leading-relaxed max-w-md mx-auto">
          This is just a fun game for friends! We're not affiliated with any music streaming services or record labels. 
          It's a free project made for good times and good music.
        </p>
      </div>

      <div className="space-y-6 animate-fade-in" style={{animationDelay: '0.3s'}}>
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
            className="h-16 text-lg bg-white/10 border-0 rounded-2xl text-white placeholder:text-white/50 
                     focus:bg-white/15 focus:ring-2 focus:ring-white/30 transition-all duration-300
                     backdrop-blur-2xl shadow-lg hover:bg-white/12 hover:scale-[1.02] focus:scale-[1.02]
                     border border-white/20"
            maxLength={20}
          />
        </div>
        
        <Button 
          onClick={handleSubmit}
          className="w-full h-16 bg-white text-black hover:bg-white/90 
                   font-semibold text-lg rounded-2xl transition-all duration-300 
                   shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]
                   border-0 tracking-tight backdrop-blur-xl"
          disabled={!name.trim()}
        >
          <Users className="mr-3 h-5 w-5" />
          Join the Game
        </Button>
      </div>
      
      <style>{`
        @keyframes fade-in {
          from { 
            opacity: 0; 
            transform: translateY(30px);
          }
          to { 
            opacity: 1; 
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}
