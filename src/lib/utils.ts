import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Shared utility for generating consistent artist-based colors
export function getArtistColor(artistName: string): { hue: number; backgroundColor: string; backgroundImage: string } {
  // Create hash from artist name for consistent color
  const artistHash = Array.from(artistName).reduce(
    (acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0
  );
  const hue = Math.abs(artistHash) % 360;
  
  return {
    hue,
    backgroundColor: `hsl(${hue}, 70%, 25%)`,
    backgroundImage: `linear-gradient(135deg, hsl(${hue}, 70%, 20%), hsl(${hue}, 70%, 35%))`
  };
}

// Utility for wrapping text at specified character limit
export function wrapTextAtCharacterLimit(text: string, maxCharsPerLine: number = 20): string {
  if (text.length <= maxCharsPerLine) return text;
  
  // Find best break point near the limit
  const words = text.split(' ');
  let currentLine = '';
  let result = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    
    if (testLine.length <= maxCharsPerLine) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        result += (result ? '\n' : '') + currentLine;
        currentLine = word;
      } else {
        // Single word longer than limit, truncate it
        result += (result ? '\n' : '') + word.substring(0, maxCharsPerLine - 3) + '...';
        currentLine = '';
      }
    }
  }
  
  if (currentLine) {
    result += (result ? '\n' : '') + currentLine;
  }
  
  return result;
}

// Utility for simple text truncation with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}
