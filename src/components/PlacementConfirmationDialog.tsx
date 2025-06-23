
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Song } from '@/types/game';
import { MysteryCard } from './MysteryCard';

interface PlacementConfirmationDialogProps {
  isOpen: boolean;
  song: Song | null;
  position: number;
  timeline: Song[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function PlacementConfirmationDialog({
  isOpen,
  song,
  position,
  timeline,
  onConfirm,
  onCancel
}: PlacementConfirmationDialogProps) {
  if (!song) return null;

  const getPositionDescription = () => {
    if (timeline.length === 0) {
      return "as your first song";
    }
    if (position === 0) {
      return `at the beginning (before ${timeline[0]?.release_year})`;
    }
    if (position >= timeline.length) {
      return `at the end (after ${timeline[timeline.length - 1]?.release_year})`;
    }
    return `between ${timeline[position - 1]?.release_year} and ${timeline[position]?.release_year}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md bg-slate-800 border-slate-600 text-white">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            Place Mystery Card?
          </DialogTitle>
          <DialogDescription className="text-center text-slate-300">
            Are you sure you want to place this card {getPositionDescription()}?
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-center py-4">
          <MysteryCard song={song} isRevealed={false} />
        </div>
        
        <DialogFooter className="flex gap-3">
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
