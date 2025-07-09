import defaultPlaylist from '../data/defaultPlaylist.json';

export interface Song {
  id: string;
  deezer_title: string;
  deezer_artist: string;
  deezer_album: string;
  release_year: string;
  genre: string;
  cardColor: string;
  preview_url?: string;
  deezer_url?: string;
}

export class defaultPlaylistService {
  private songs: Song[] = [];

  /**
   * Loads and validates the default playlist with API optimization
   * @returns Promise<Song[]> Array of valid songs
   */
  async loaddefaultPlaylist(): Promise<Song[]> {
    console.log('🎵 Loading default playlist with performance optimization...');
    this.songs = defaultPlaylist
      .filter(item => this.validateSong(item))
      .map(item => this.mapToSong(item));
    console.log(`✅ Loaded ${this.songs.length} valid songs (previews fetched on-demand)`);
    return this.songs;
  }

  /**
   * Loads a limited set of songs with previews for immediate game start.
   * Will keep trying additional songs until we get enough with previews.
   * @param minSongs Minimum number of songs needed with previews
   * @returns Promise<Song[]> Array of songs with valid previews
   */
  async loadOptimizedGameSongs(minSongs: number = 20): Promise<Song[]> {
    if (this.songs.length === 0) {
      await this.loaddefaultPlaylist();
    }

    const shuffledSongs = [...this.songs].sort(() => Math.random() - 0.5);
    const songsWithPreviews: Song[] = [];
    let songsProcessed = 0;
    let successCount = 0;
    let failCount = 0;

    for (const song of shuffledSongs) {
      if (songsWithPreviews.length >= minSongs) break;
      if (songsProcessed >= Math.min(80, this.songs.length)) break;

      try {
        songsProcessed++;
        const songWithPreview = await this.fetchPreviewUrl(song);
        if (songWithPreview.preview_url) {
          songsWithPreviews.push(songWithPreview);
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }
    return songsWithPreviews;
  }

  /**
   * Pick and remove a random song from the pool.
   * @returns Song | null
   */
  pickAndRemoveRandomSong(): Song | null {
    if (this.songs.length === 0) return null;
    const idx = Math.floor(Math.random() * this.songs.length);
    return this.songs.splice(idx, 1)[0];
  }

  /**
   * Pick and remove multiple random songs from the pool.
   * @param count Number of songs to pick
   * @returns Song[]
   */
  pickAndRemoveMultipleSongs(count: number): Song[] {
    const picked: Song[] = [];
    for (let i = 0; i < count && this.songs.length > 0; i++) {
      const song = this.pickAndRemoveRandomSong();
      if (song) picked.push(song);
    }
    return picked;
  }

  /**
   * Just get a random song (does not remove it).
   * @returns Song | null
   */
  getRandomSong(): Song | null {
    return this.songs.length > 0
      ? this.songs[Math.floor(Math.random() * this.songs.length)]
      : null;
  }

  /**
   * Get a random song that has a valid preview URL (does not remove it).
   * @returns Song | null
   */
  getRandomSongWithPreview(): Song | null {
    const songsWithPreviews = this.songs.filter(song => song.preview_url);
    return songsWithPreviews.length > 0
      ? songsWithPreviews[Math.floor(Math.random() * songsWithPreviews.length)]
      : null;
  }

  /**
   * Get the number of songs currently in the pool.
   * @returns number
   */
  getSongsCount(): number {
    return this.songs.length;
  }

  /**
   * Filters valid songs from an array.
   * @param songs Array of songs to filter
   * @returns Array of valid songs
   */
  filterValidSongs(songs: Song[]): Song[] {
    return songs.filter(song => {
      if (!song.release_year || !song.deezer_title || !song.deezer_artist) return false;
      const year = parseInt(song.release_year.toString());
      return !(isNaN(year) || year < 1900 || year > new Date().getFullYear());
    });
  }

  /**
   * Filters songs that have valid preview URLs.
   * @param songs Array of songs to filter
   * @returns Array of songs with valid preview URLs
   */
  filterSongsWithPreview(songs: Song[]): Song[] {
    return songs.filter(song => !!song.preview_url);
  }

  /**
   * Internal: Validate a song item from the raw playlist data.
   * @param item
   */
  private validateSong(item: any): boolean {
    return (
      item &&
      item.deezer_title &&
      item.deezer_artist &&
      item.release_year &&
      !isNaN(parseInt(item.release_year.toString()))
    );
  }

  /**
   * Internal: Map raw playlist item to Song object.
   * @param item
   */
  private mapToSong(item: any): Song {
    return {
      id: Math.random().toString(36).substring(2, 11),
      deezer_title: item.deezer_title || 'Unknown Title',
      deezer_artist: item.deezer_artist || 'Unknown Artist',
      deezer_album: item.deezer_album || 'Unknown Album',
      release_year: item.release_year.toString(),
      genre: item.genre || 'Unknown',
      cardColor: this.generateCardColor(),
      preview_url: item.preview_url || undefined,
      deezer_url: item.deezer_url || undefined,
    };
  }

  /**
   * Internal: Generate a random color string for cards.
   */
  private generateCardColor(): string {
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
      '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Internal: Simulate fetching a preview URL.
   * Replace this with real API as needed.
   */
  private async fetchPreviewUrl(song: Song): Promise<Song> {
    // Simulate async, or replace with real API call
    return new Promise(resolve => {
      setTimeout(() => {
        // Simulate preview_url existing for some songs
        if (!song.preview_url && Math.random() < 0.7) {
          song.preview_url = `https://preview.deezer.com/${song.id}`;
        }
        resolve(song);
      }, 30);
    });
  }
}

const defaultPlaylistService = new defaultPlaylistService();
export default defaultPlaylistService;