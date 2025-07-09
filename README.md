# Timeliner - Music Timeline Game

A multiplayer music timeline game where players guess when songs were released and organize them chronologically.

## Project Structure

### Core Files
- `src/pages/Index.tsx` - Main application entry point and game state management
- `src/App.tsx` - Application setup with routing and global providers

### Game Components
- `src/components/GamePlay.tsx` - Main game orchestration component
- `src/components/HostVisuals.tsx` - Host display with record player and cassette players
- `src/components/PlayerVisuals.tsx` - Player view for mobile devices
- `src/components/VictoryScreen.tsx` - End game celebration screen

### Host Components
- `src/components/HostLobby.tsx` - Host lobby for game setup
- `src/components/HostGameView.tsx` - Host game view wrapper
- `src/components/CassettePlayerDisplay.tsx` - Cassette tape player icons for host
- `src/components/RecordMysteryCard.tsx` - Record player with mystery song

### Player Components
- `src/components/MobileJoin.tsx` - Mobile joining screen
- `src/components/MobilePlayerLobby.tsx` - Mobile lobby view
- `src/components/PlayerTimeline.tsx` - Player's timeline for placing songs
- `src/components/MysteryCard.tsx` - Mystery song card component

### Game Logic
- `src/hooks/useGameRoom.tsx` - Room management and real-time sync
- `src/hooks/useGameLogic.tsx` - Core game mechanics
- `src/services/gameService.ts` - Database operations
- `src/services/defaultPlaylistService.ts` - Song playlist management
- `src/services/DeezerAudioService.ts` - Audio preview handling

### Styling
- `src/styles/design-system.css` - Design system with CSS variables
- `src/styles/animations.css` - Game animations and transitions
- `src/index.css` - Base styles and Tailwind setup
- `tailwind.config.ts` - Tailwind configuration

### Assets
- `src/assets/` - Game images (cassette tapes, record player, record)

### Types
- `src/types/game.ts` - TypeScript interfaces for game objects

## Development Setup

```sh
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Technologies Used

- **React** - Frontend framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Supabase** - Real-time database and backend
- **shadcn/ui** - UI component library

## Game Features

- Real-time multiplayer gameplay
- Custom cassette tape player icons for each player
- Record player mystery card display
- Audio preview system with Deezer integration
- Timeline-based song placement mechanics
- Host/player role separation
- QR code joining system

## Deployment

Deploy via [Lovable](https://lovable.dev/projects/f0f391ce-3307-4d50-ad92-9e1d2ad743e1) by clicking Share → Publish.
