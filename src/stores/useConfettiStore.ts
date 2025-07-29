
import { create } from 'zustand';

interface ConfettiStore {
  fire: () => void;
}

export const useConfettiStore = create<ConfettiStore>((set) => ({
  fire: () => {
    // Simple confetti implementation
    console.log('🎉 Confetti fired!');
  }
}));
