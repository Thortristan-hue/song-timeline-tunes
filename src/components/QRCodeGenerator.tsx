
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
  className?: string;
  bgColor?: string;
  fgColor?: string;
  showLabels?: boolean;
}

export function QRCodeGenerator({ 
  value, 
  size = 200, 
  className, 
  bgColor = "#ffffff",
  fgColor = "#000000",
  showLabels = true
}: QRCodeGeneratorProps) {
  const joinUrl = `${window.location.origin}?join=${encodeURIComponent(value)}`;
  
  return (
    <div className={`text-center space-y-3 ${className}`}>
      {showLabels && <div className="font-bold text-white text-lg">Scan to Join</div>}
      <div className="mx-auto inline-block shadow-lg rounded-2xl overflow-hidden" style={{ backgroundColor: bgColor }}>
        <QRCodeSVG 
          value={joinUrl}
          size={size}
          level="M"
          includeMargin={true}
          bgColor={bgColor}
          fgColor={fgColor}
          className="rounded"
        />
      </div>
      {showLabels && (
        <div className="text-sm text-white/60">
          Or visit: <span className="font-mono text-blue-400">{window.location.origin}</span>
          <br />
          Room Code: <span className="font-mono font-bold text-lg text-white">{value}</span>
        </div>
      )}
    </div>
  );
}
