import { useState, useEffect } from 'react';

interface ImagePreloaderProps {
  images: string[];
  onLoadComplete?: () => void;
}

export function useImagePreloader({ images, onLoadComplete }: ImagePreloaderProps) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (images.length === 0) {
      setIsLoading(false);
      onLoadComplete?.();
      return;
    }

    const imagePromises = images.map((src) => {
      return new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(src);
        img.onerror = () => reject(src);
        img.src = src;
      });
    });

    Promise.allSettled(imagePromises).then((results) => {
      const loaded = new Set<string>();
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          loaded.add(images[index]);
        }
      });
      
      setLoadedImages(loaded);
      setIsLoading(false);
      onLoadComplete?.();
    });
  }, [images, onLoadComplete]);

  return { loadedImages, isLoading };
}