
import React from 'react';

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
  className?: string;
}

export function QRCodeGenerator({ value, size = 200, className }: QRCodeGeneratorProps) {
  // Use QR Server API which is more reliable and CORS-friendly
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`;
  
  return (
    <div className={`text-center space-y-3 ${className}`}>
      <div className="font-bold text-slate-800 text-lg">Scan to Join</div>
      <div className="mx-auto bg-white p-2 rounded-lg inline-block shadow-lg">
        <img 
          src={qrCodeUrl}
          alt="QR Code to join game"
          width={size}
          height={size}
          className="mx-auto rounded"
          onError={(e) => {
            console.error('QR Code failed to load:', e);
            const target = e.currentTarget;
            target.style.display = 'none';
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'block';
          }}
        />
        <div 
          className="text-xs text-center p-4 bg-slate-100 rounded border hidden"
          style={{ width: size, height: size }}
        >
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-2xl mb-2">📱</div>
            <div className="font-mono text-xs break-all">
              {window.location.origin}
            </div>
            <div className="text-slate-600 mt-1">Manual entry</div>
          </div>
        </div>
      </div>
      <div className="text-sm text-slate-600">
        Or visit: <span className="font-mono text-blue-600">{window.location.origin}</span>
      </div>
    </div>
  );
}
