
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
  // Check if value is already a URL or just a lobby code
  const isUrl = value.startsWith('http://') || value.startsWith('https://');
  const joinUrl = isUrl ? value : `${window.location.origin}?join=${encodeURIComponent(value)}`;
  
  // Extract lobby code from URL for display
  const lobbyCode = isUrl ? new URLSearchParams(new URL(value).search).get('join') || value : value;
  
  console.log('[QRCodeGenerator] QR Code generated for URL:', joinUrl);
  
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
          Room Code: <span className="font-mono font-bold text-lg text-white">{lobbyCode}</span>
        </div>
      )}
    </div>
  );
}
