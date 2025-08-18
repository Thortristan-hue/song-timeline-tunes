
import { useEffect, useRef } from 'react';
import QRCode from 'qrcode.react';

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
}

export function QRCodeGenerator({ value, size = 200 }: QRCodeGeneratorProps) {
  return (
    <div className="flex items-center justify-center p-4 bg-white rounded-lg">
      <QRCode value={value} size={size} />
    </div>
  );
}
