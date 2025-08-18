
import { create } from 'zustand';
import { suppressUnused } from '@/utils/suppressUnused';

interface ConfettiState {
  isActive: boolean;
  trigger: () => void;
}

export const useConfettiStore = create<ConfettiState>((set, get) => {
  suppressUnused(get);
  
  return {
    isActive: false,
    trigger: () => set({ isActive: true }),
  };
});
