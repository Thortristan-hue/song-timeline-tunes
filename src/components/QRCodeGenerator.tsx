
import React from 'react';
import { Card } from '@/components/ui/card';

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
  className?: string;
}

export function QRCodeGenerator({ value, size = 200, className }: QRCodeGeneratorProps) {
  // Simple QR code using a different service with better CORS support
  const qrCodeUrl = `https://qr-generator.qrcode.studio/qr/custom?download=true&file=svg&data=${encodeURIComponent(value)}&size=${size}&config=%7B%22body%22%3A%22square%22%2C%22eye%22%3A%22square%22%2C%22eyeBall%22%3A%22square%22%2C%22erf1%22%3A%5B%5D%2C%22erf2%22%3A%5B%5D%2C%22erf3%22%3A%5B%5D%2C%22brf1%22%3A%5B%5D%2C%22brf2%22%3A%5B%5D%2C%22brf3%22%3A%5B%5D%2C%22bodyColor%22%3A%22%23000000%22%2C%22bgColor%22%3A%22%23FFFFFF%22%2C%22eye1Color%22%3A%22%23000000%22%2C%22eye2Color%22%3A%22%23000000%22%2C%22eye3Color%22%3A%22%23000000%22%2C%22eyeBall1Color%22%3A%22%23000000%22%2C%22eyeBall2Color%22%3A%22%23000000%22%2C%22eyeBall3Color%22%3A%22%23000000%22%2C%22gradientColor1%22%3A%22%23000000%22%2C%22gradientColor2%22%3A%22%23000000%22%2C%22gradientType%22%3A%22linear%22%2C%22gradientOnEyes%22%3Afalse%2C%22logo%22%3A%22%22%2C%22logoMode%22%3A%22default%22%7D`;
  
  // Alternative fallback using a simpler service
  const fallbackQrUrl = `https://chart.googleapis.com/chart?chs=${size}x${size}&cht=qr&chl=${encodeURIComponent(value)}`;
  
  return (
    <div className={`text-center space-y-3 ${className}`}>
      <div className="font-bold text-slate-800 text-lg">Scan to Join</div>
      <div className="mx-auto bg-white p-2 rounded-lg inline-block">
        <img 
          src={fallbackQrUrl}
          alt="QR Code to join game"
          width={size}
          height={size}
          className="mx-auto rounded border border-slate-200"
          onError={(e) => {
            // If both services fail, show a text fallback
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
