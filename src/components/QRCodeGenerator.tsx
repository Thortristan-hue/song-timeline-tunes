
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
}

export function QRCodeGenerator({ value, size = 128 }: QRCodeGeneratorProps) {
  return (
    <div className="p-4 bg-white rounded-lg">
      <QRCodeSVG
        value={value}
        size={size}
        bgColor="#ffffff"
        fgColor="#000000"
        level="M"
        includeMargin
      />
    </div>
  );
}
