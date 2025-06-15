
import { Song } from "@/pages/Index";

export const loadSongsFromJson = async (jsonFile: File): Promise<Song[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const jsonData = JSON.parse(event.target?.result as string);
        
        // Convert JSON data to Song format
        const songs: Song[] = jsonData.map((item: any) => ({
          deezer_artist: item.artist || item.deezer_artist || "Unknown Artist",
          deezer_title: item.title || item.deezer_title || "Unknown Title",
          deezer_album: item.album || item.deezer_album || "Unknown Album",
          preview_url: item.preview || item.preview_url || "",
          release_year: item.year || item.release_year || "Unknown",
          genre: item.genre || "Unknown"
        }));
        
        resolve(songs);
      } catch (error) {
        reject(new Error("Invalid JSON format"));
      }
    };
    
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(jsonFile);
  });
};
