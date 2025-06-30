
import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

interface PlayerConfirmationProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function PlayerConfirmation({ onConfirm, onCancel }: PlayerConfirmationProps) {
  return (
    <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-30">
      <div className="flex gap-3 bg-slate-800/80 backdrop-blur-lg p-4 rounded-2xl border border-slate-600/30 shadow-xl">
        <Button
          onClick={onConfirm}
          size="sm"
          className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white rounded-xl px-4 h-10 font-bold"
        >
          <Check className="h-4 w-4 mr-2" />
          Confirm
        </Button>
        <Button
          onClick={onCancel}
          size="sm"
          className="bg-slate-600/80 hover:bg-slate-500/80 text-white rounded-xl px-4 h-10 font-bold border border-slate-500/50"
        >
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>
    </div>
  );
}
