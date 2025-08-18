import { create } from 'zustand';
import { suppressUnused } from '@/utils/suppressUnused';

interface ConfettiStore {
  isActive: boolean;
  triggerConfetti: () => void;
}

export const useConfettiStore = create<ConfettiStore>((set, get) => {
  suppressUnused(set);
  return {
    isActive: false,
    triggerConfetti: () => {
      set({ isActive: true });
      setTimeout(() => {
        set({ isActive: false });
      }, 3000);
    }
  };
});
