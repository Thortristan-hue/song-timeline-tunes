
import React from 'react';
import { Card } from '@/components/ui/card';

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
  className?: string;
}

export function QRCodeGenerator({ value, size = 200, className }: QRCodeGeneratorProps) {
  // Using QR Server API for simple QR code generation
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`;
  
  return (
    <Card className={`p-4 bg-white rounded-xl shadow-lg ${className}`}>
      <div className="text-center space-y-3">
        <div className="font-bold text-slate-800 text-lg">Scan to Join</div>
        <div className="mx-auto">
          <img 
            src={qrCodeUrl} 
            alt="QR Code to join game"
            width={size}
            height={size}
            className="mx-auto rounded-lg border border-slate-200"
            onError={(e) => {
              // Fallback if QR service fails
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        <div className="text-sm text-slate-600">
          Or visit: <span className="font-mono text-blue-600">{window.location.origin}</span>
        </div>
      </div>
    </Card>
  );
}
