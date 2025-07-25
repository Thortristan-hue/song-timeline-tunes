import { Song } from '@/types/game';

/**
 * Service for generating random songs for player timelines
 */
export class RandomSongService {
  private static readonly SAMPLE_SONGS: Omit<Song, 'id'>[] = [
    { deezer_title: "Bohemian Rhapsody", deezer_artist: "Queen", deezer_album: "A Night at the Opera", release_year: "1975", genre: "Rock", cardColor: "#8B5CF6", preview_url: undefined },
    { deezer_title: "Billie Jean", deezer_artist: "Michael Jackson", deezer_album: "Thriller", release_year: "1982", genre: "Pop", cardColor: "#EF4444", preview_url: undefined },
    { deezer_title: "Smells Like Teen Spirit", deezer_artist: "Nirvana", deezer_album: "Nevermind", release_year: "1991", genre: "Grunge", cardColor: "#10B981", preview_url: undefined },
    { deezer_title: "Hotel California", deezer_artist: "Eagles", deezer_album: "Hotel California", release_year: "1976", genre: "Rock", cardColor: "#F59E0B", preview_url: undefined },
    { deezer_title: "Imagine", deezer_artist: "John Lennon", deezer_album: "Imagine", release_year: "1971", genre: "Pop", cardColor: "#3B82F6", preview_url: undefined },
    { deezer_title: "Sweet Child O' Mine", deezer_artist: "Guns N' Roses", deezer_album: "Appetite for Destruction", release_year: "1987", genre: "Rock", cardColor: "#DC2626", preview_url: undefined },
    { deezer_title: "Like a Prayer", deezer_artist: "Madonna", deezer_album: "Like a Prayer", release_year: "1989", genre: "Pop", cardColor: "#EC4899", preview_url: undefined },
    { deezer_title: "Thriller", deezer_artist: "Michael Jackson", deezer_album: "Thriller", release_year: "1982", genre: "Pop", cardColor: "#7C3AED", preview_url: undefined },
    { deezer_title: "Stairway to Heaven", deezer_artist: "Led Zeppelin", deezer_album: "Led Zeppelin IV", release_year: "1971", genre: "Rock", cardColor: "#059669", preview_url: undefined },
    { deezer_title: "Purple Rain", deezer_artist: "Prince", deezer_album: "Purple Rain", release_year: "1984", genre: "Pop", cardColor: "#7C2D12", preview_url: undefined },
    { deezer_title: "I Want to Break Free", deezer_artist: "Queen", deezer_album: "The Works", release_year: "1984", genre: "Rock", cardColor: "#B91C1C", preview_url: undefined },
    { deezer_title: "Don't Stop Believin'", deezer_artist: "Journey", deezer_album: "Escape", release_year: "1981", genre: "Rock", cardColor: "#1D4ED8", preview_url: undefined },
    { deezer_title: "Every Breath You Take", deezer_artist: "The Police", deezer_album: "Synchronicity", release_year: "1983", genre: "Pop", cardColor: "#15803D", preview_url: undefined },
    { deezer_title: "Take on Me", deezer_artist: "a-ha", deezer_album: "Hunting High and Low", release_year: "1985", genre: "Pop", cardColor: "#0D9488", preview_url: undefined },
    { deezer_title: "Another Brick in the Wall", deezer_artist: "Pink Floyd", deezer_album: "The Wall", release_year: "1979", genre: "Rock", cardColor: "#4338CA", preview_url: undefined },
    { deezer_title: "Beat It", deezer_artist: "Michael Jackson", deezer_album: "Thriller", release_year: "1982", genre: "Pop", cardColor: "#BE185D", preview_url: undefined },
    { deezer_title: "Girls Just Want to Have Fun", deezer_artist: "Cyndi Lauper", deezer_album: "She's So Unusual", release_year: "1983", genre: "Pop", cardColor: "#C2410C", preview_url: undefined },
    { deezer_title: "Come As You Are", deezer_artist: "Nirvana", deezer_album: "Nevermind", release_year: "1991", genre: "Grunge", cardColor: "#7C3AED", preview_url: undefined },
    { deezer_title: "Livin' on a Prayer", deezer_artist: "Bon Jovi", deezer_album: "Slippery When Wet", release_year: "1986", genre: "Rock", cardColor: "#DC2626", preview_url: undefined },
    { deezer_title: "Material Girl", deezer_artist: "Madonna", deezer_album: "Like a Virgin", release_year: "1984", genre: "Pop", cardColor: "#DB2777", preview_url: undefined },
    { deezer_title: "Welcome to the Jungle", deezer_artist: "Guns N' Roses", deezer_album: "Appetite for Destruction", release_year: "1987", genre: "Rock", cardColor: "#059669", preview_url: undefined },
    { deezer_title: "Pour Some Sugar on Me", deezer_artist: "Def Leppard", deezer_album: "Hysteria", release_year: "1987", genre: "Rock", cardColor: "#B91C1C", preview_url: undefined },
    { deezer_title: "Tainted Love", deezer_artist: "Soft Cell", deezer_album: "Non-Stop Erotic Cabaret", release_year: "1981", genre: "New Wave", cardColor: "#7C2D12", preview_url: undefined },
    { deezer_title: "Eye of the Tiger", deezer_artist: "Survivor", deezer_album: "Eye of the Tiger", release_year: "1982", genre: "Rock", cardColor: "#EA580C", preview_url: undefined },
    { deezer_title: "Karma Chameleon", deezer_artist: "Culture Club", deezer_album: "Colour by Numbers", release_year: "1983", genre: "Pop", cardColor: "#16A34A", preview_url: undefined },
    { deezer_title: "Total Eclipse of the Heart", deezer_artist: "Bonnie Tyler", deezer_album: "Faster Than the Speed of Night", release_year: "1983", genre: "Pop", cardColor: "#2563EB", preview_url: undefined },
    { deezer_title: "I Love Rock 'n Roll", deezer_artist: "Joan Jett & the Blackhearts", deezer_album: "I Love Rock 'n Roll", release_year: "1981", genre: "Rock", cardColor: "#DC2626", preview_url: undefined },
    { deezer_title: "Footloose", deezer_artist: "Kenny Loggins", deezer_album: "Footloose", release_year: "1984", genre: "Pop", cardColor: "#F59E0B", preview_url: undefined },
    { deezer_title: "Money for Nothing", deezer_artist: "Dire Straits", deezer_album: "Brothers in Arms", release_year: "1985", genre: "Rock", cardColor: "#059669", preview_url: undefined },
    { deezer_title: "Time After Time", deezer_artist: "Cyndi Lauper", deezer_album: "She's So Unusual", release_year: "1983", genre: "Pop", cardColor: "#EC4899", preview_url: undefined }
  ];

  /**
   * Generate random songs for a player's timeline
   * @param count Number of songs to generate (1-5)
   * @returns Array of random songs with unique IDs
   */
  static generateRandomSongs(count: number = 3): Song[] {
    const shuffled = [...this.SAMPLE_SONGS].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(count, this.SAMPLE_SONGS.length));
    
    return selected.map((song, index) => ({
      ...song,
      id: `random_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`
    }));
  }

  /**
   * Generate a single random song
   * @returns A random song with unique ID
   */
  static generateRandomSong(): Song {
    const randomIndex = Math.floor(Math.random() * this.SAMPLE_SONGS.length);
    const song = this.SAMPLE_SONGS[randomIndex];
    
    return {
      ...song,
      id: `random_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  /**
   * Add random songs to all players in a game
   * @param players Array of players to add songs to
   * @param songsPerPlayer Number of songs to add per player (1-3)
   * @returns Updated players array with random songs
   */
  static addRandomSongsToPlayers(players: any[], songsPerPlayer: number = 2): any[] {
    return players.map(player => {
      const randomSongs = this.generateRandomSongs(songsPerPlayer);
      return {
        ...player,
        timeline: [...(player.timeline || []), ...randomSongs]
      };
    });
  }
}