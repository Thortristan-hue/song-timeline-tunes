
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
  className?: string;
}

export function QRCodeGenerator({ value, size = 200, className }: QRCodeGeneratorProps) {
  const joinUrl = `${window.location.origin}?join=${encodeURIComponent(value)}`;
  
  return (
    <div className={`text-center space-y-3 ${className}`}>
      <div className="font-bold text-slate-800 text-lg">Scan to Join</div>
      <div className="mx-auto bg-white p-4 rounded-lg inline-block shadow-lg">
        <QRCodeSVG 
          value={joinUrl}
          size={size}
          level="M"
          includeMargin={true}
          className="rounded"
        />
      </div>
      <div className="text-sm text-slate-600">
        Or visit: <span className="font-mono text-blue-600">{window.location.origin}</span>
        <br />
        Room Code: <span className="font-mono font-bold text-lg">{value}</span>
      </div>
    </div>
  );
}
