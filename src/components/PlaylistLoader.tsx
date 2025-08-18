import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, FileMusic, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { Song } from '@/types/game';
import { cn } from '@/lib/utils';

interface PlaylistLoaderProps {
  onPlaylistLoad: (songs: Song[]) => void;
  onError: (message: string) => void;
  isLoading: boolean;
  currentSongs: Song[];
}

export function PlaylistLoader({
  onPlaylistLoad,
  onError,
  isLoading,
  currentSongs
}: PlaylistLoaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFile(e.dataTransfer.files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFile(e.target.files);
    }
  };

  const handleFile = async (files: FileList) => {
    if (!files.length) {
      setUploadStatus('idle');
      setUploadMessage('');
      return;
    }

    const file = files[0];

    if (file.type !== 'application/json') {
      setUploadStatus('error');
      setUploadMessage('Invalid file type. Please upload a JSON file.');
      onError('Invalid file type. Please upload a JSON file.');
      return;
    }

    setUploadStatus('processing');
    setUploadMessage('Processing playlist...');

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const jsonString = e.target?.result as string;
          const data = JSON.parse(jsonString);

          if (!Array.isArray(data)) {
            setUploadStatus('error');
            setUploadMessage('Invalid JSON format: Must be an array of songs.');
            onError('Invalid JSON format: Must be an array of songs.');
            return;
          }

          // Validate each song object
          const validatedSongs: Song[] = data.map((item: any, index: number) => {
            if (
              typeof item.id !== 'string' ||
              typeof item.deezer_title !== 'string' ||
              typeof item.deezer_artist !== 'string' ||
              typeof item.deezer_album !== 'string' ||
              typeof item.release_year !== 'string' ||
              typeof item.genre !== 'string' ||
              typeof item.cardColor !== 'string'
            ) {
              console.warn(`[PlaylistLoader] Invalid song format at index ${index}:`, item);
              return null;
            }

            return {
              id: item.id,
              deezer_title: item.deezer_title,
              deezer_artist: item.deezer_artist,
              deezer_album: item.deezer_album,
              release_year: item.release_year,
              genre: item.genre,
              cardColor: item.cardColor,
              preview_url: item.preview_url || undefined,
              deezer_url: item.deezer_url || undefined,
            };
          }).filter(song => song !== null) as Song[];

          if (validatedSongs.length === 0) {
            setUploadStatus('error');
            setUploadMessage('No valid songs found in the playlist.');
            onError('No valid songs found in the playlist.');
            return;
          }

          onPlaylistLoad(validatedSongs);
          setUploadStatus('success');
          setUploadMessage('Playlist loaded successfully!');
        } catch (parseError) {
          console.error('[PlaylistLoader] Error parsing JSON:', parseError);
          setUploadStatus('error');
          setUploadMessage('Error parsing JSON. Please ensure the file is valid.');
          onError('Error parsing JSON. Please ensure the file is valid.');
        }
      };

      reader.onerror = () => {
        setUploadStatus('error');
        setUploadMessage('Failed to read the file.');
        onError('Failed to read the file.');
      };

      reader.readAsText(file);
    } catch (error) {
      console.error('[PlaylistLoader] Error loading playlist:', error);
      setUploadStatus('error');
      setUploadMessage('Failed to load the playlist.');
      onError('Failed to load the playlist.');
    }
  };

  const handleClickBrowse = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="w-full p-6 space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
          Load Your Custom Playlist
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Upload a JSON file containing your songs.
        </p>
      </div>

      <div
        className={cn(
          "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer",
          "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300",
          isDragOver ? "border-blue-500 dark:border-blue-400" : "border-gray-300",
          uploadStatus === 'processing' ? 'animate-pulse' : '',
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClickBrowse}
      >
        <input
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileSelect}
          ref={fileInputRef}
        />
        {uploadStatus === 'idle' && (
          <>
            <Upload className="mx-auto h-6 w-6 text-gray-400 dark:text-gray-500 mb-2" />
            <p>Drag and drop your JSON file here, or click to browse.</p>
          </>
        )}
        {uploadStatus === 'processing' && (
          <>
            <Loader2 className="mx-auto h-6 w-6 text-blue-500 animate-spin mb-2" />
            <p>{uploadMessage}</p>
          </>
        )}
        {uploadStatus === 'success' && (
          <>
            <CheckCircle className="mx-auto h-6 w-6 text-green-500 mb-2" />
            <p className="text-green-500">{uploadMessage}</p>
          </>
        )}
        {uploadStatus === 'error' && (
          <>
            <AlertTriangle className="mx-auto h-6 w-6 text-red-500 mb-2" />
            <p className="text-red-500">{uploadMessage}</p>
          </>
        )}
      </div>

      {currentSongs.length > 0 && uploadStatus !== 'processing' && (
        <div className="space-y-2">
          <h4 className="text-lg font-semibold text-gray-700 dark:text-white">
            Current Playlist
          </h4>
          <Badge className="bg-blue-500 text-white">
            {currentSongs.length} Songs
          </Badge>
        </div>
      )}
    </Card>
  );
}
