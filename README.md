
# Timeliner - Music Timeline Game

A real-time multiplayer music timeline game where players guess when songs were released and organize them chronologically. Players join via mobile devices while the host displays the game on a larger screen, creating an engaging party game experience.

## Game Overview

Timeliner is a social music guessing game that tests players' knowledge of music history. The host presents mystery songs, and players must place them in the correct chronological order on their personal timelines. Points are awarded for correct placements, and the first player to reach 10 songs wins!

## Project Architecture

### Core Application Files
- `src/App.tsx` - Root application component with React Query setup, routing configuration, and global providers (Toaster, Tooltip)
- `src/pages/Index.tsx` - Main game orchestration page that manages room state, player connections, and game phase transitions
- `src/pages/NotFound.tsx` - 404 error page for invalid routes

### Game Logic & State Management
- `src/hooks/useGameLogic.tsx` - Core game mechanics including turn management, song selection, scoring logic, and win conditions
- `src/hooks/useGameRoom.tsx` - Real-time room management with Supabase integration, player synchronization, and connection handling
- `src/hooks/useRealtimeSubscription.tsx` - Robust real-time subscription system with automatic reconnection, retry logic, and network monitoring
- `src/hooks/useSoundEffects.tsx` - Audio feedback system for game events (card placement, success/error sounds, victory music)
- `src/hooks/use-mobile.tsx` - Mobile device detection utility for responsive behavior

### Game Components

#### Core Game Flow
- `src/components/GamePlay.tsx` - Main game orchestration component that coordinates between host and player views, manages audio playback, and handles game state transitions
- `src/components/MainMenu.tsx` - Initial game menu where users choose to host or join games
- `src/components/VictoryScreen.tsx` - End game celebration screen with winner announcement and confetti effects

#### Host Components (Large Screen Display)
- `src/components/HostVisuals.tsx` - Complete host game interface with record player, cassette displays, and player timelines
- `src/components/HostLobby.tsx` - Pre-game lobby for hosts to manage settings and view joining players
- `src/components/RecordMysteryCard.tsx` - Animated record player component that displays the current mystery song with spinning record animation
- `src/components/CassettePlayerDisplay.tsx` - Visual representation of each player as a unique cassette tape player with custom colors

#### Player Components (Mobile Interface)
- `src/components/MobileJoin.tsx` - Mobile-optimized room joining interface with lobby code input
- `src/components/MobilePlayerLobby.tsx` - Mobile lobby view showing other players and game status
- `src/components/player/MobilePlayerGameView.tsx` - Complete mobile game interface for placing cards on personal timelines
- `src/components/PlayerJoinForm.tsx` - Form component for entering player name when joining games
- `src/components/MysteryCard.tsx` - Mobile mystery song card component with audio controls

#### Shared UI Components
- `src/components/QRCodeGenerator.tsx` - QR code display for easy mobile joining
- `src/components/ConnectionStatus.tsx` - Real-time connection status indicator with reconnection controls
- `src/components/ErrorBoundary.tsx` - Global error handling wrapper for graceful error recovery
- `src/components/GameErrorBoundary.tsx` - Game-specific error boundary with retry functionality

#### Host Display Components
- `src/components/host/HostGameBackground.tsx` - Themed background component with particle effects
- `src/components/host/HostHeader.tsx` - Game header showing room code, current player, and game status
- `src/components/host/HostCurrentPlayerTimeline.tsx` - Display of the current player's song timeline
- `src/components/host/HostAllPlayersOverview.tsx` - Overview grid showing all players' progress and scores

#### Layout Components
- `src/components/CircularPlayersLayout.tsx` - Circular arrangement of player displays for host view
- `src/components/SidePlayersStack.tsx` - Side-stacked player display alternative layout

### Services & Data Management

#### Backend Services
- `src/services/gameService.ts` - Supabase database operations for rooms, players, game state, and turn management
- `src/services/defaultPlaylistService.ts` - Music playlist management with Deezer API integration for song metadata and audio previews
- `src/services/DeezerAudioService.ts` - Audio preview handling with cross-origin support and error recovery

#### Data & Configuration
- `src/data/defaultPlaylist.json` - Default song collection with metadata (title, artist, year, Deezer IDs)
- `src/types/game.ts` - TypeScript interfaces for Song, Player, GameRoom, and other game entities

### Styling & Design System

#### CSS Architecture
- `src/styles/design-system.css` - Comprehensive design system with CSS custom properties for colors, spacing, typography, and animations
- `src/styles/animations.css` - Game-specific animations including card movements, particle effects, and transitions
- `src/index.css` - Base Tailwind CSS setup, global styles, and responsive breakpoints
- `tailwind.config.ts` - Tailwind configuration with custom colors, animations, and design tokens

#### Visual Assets
- `src/assets/record-player.png` - Vintage record player image for host display
- `src/assets/record.png` - Vinyl record image with spinning animation
- `src/assets/cassette-*.png` - Collection of colorful cassette tape images for player representation
- `src/assets/timeliner_bg.jpg` - Game background image with retro music theme

### UI Component Library

#### Core Components (`src/components/ui/`)
Complete shadcn/ui component collection including:
- **Form Controls**: `button.tsx`, `input.tsx`, `textarea.tsx`, `checkbox.tsx`, `radio-group.tsx`, `select.tsx`, `slider.tsx`, `switch.tsx`
- **Layout**: `card.tsx`, `separator.tsx`, `sheet.tsx`, `tabs.tsx`, `accordion.tsx`, `collapsible.tsx`, `resizable.tsx`
- **Navigation**: `navigation-menu.tsx`, `menubar.tsx`, `breadcrumb.tsx`, `pagination.tsx`
- **Feedback**: `toast.tsx`, `alert.tsx`, `progress.tsx`, `skeleton.tsx`, `badge.tsx`
- **Overlays**: `dialog.tsx`, `popover.tsx`, `hover-card.tsx`, `tooltip.tsx`, `dropdown-menu.tsx`, `context-menu.tsx`
- **Data Display**: `table.tsx`, `calendar.tsx`, `carousel.tsx`, `chart.tsx`
- **Utilities**: `scroll-area.tsx`, `aspect-ratio.tsx`, `avatar.tsx`, `command.tsx`, `drawer.tsx`, `form.tsx`

### Backend Infrastructure

#### Database Schema (`supabase/migrations/`)
- **Game Rooms Table**: Stores room metadata, lobby codes, current game state, and turn information
- **Players Table**: Player profiles, timelines, scores, and session management
- **Game Moves Table**: Historical record of all game actions for replay and analytics
- **RLS Policies**: Row-level security ensuring players only access their own data

#### Real-time Features
- Live player synchronization across devices
- Instant game state updates (turns, scores, card placements)
- Connection status monitoring with automatic reconnection
- Cross-device audio synchronization

### Audio System

#### Sound Effects (`public/sounds/`)
- `game-start.mp3` - Game initialization sound
- `card-place.mp3`, `card-woosh.mp3`, `card-throw.mp3` - Card interaction feedback
- `correct.mp3`, `incorrect.mp3` - Placement result audio
- `player-join.mp3` - New player notification
- `turn-transition.mp3` - Turn change indication
- `victory.mp3` - Game completion celebration
- `timeline-complete.mp3` - Player timeline completion
- `button-click.mp3` - UI interaction feedback

#### Audio Features
- Deezer API integration for 30-second song previews
- Cross-origin audio support with fallback handling
- Mobile-optimized audio playback with user interaction requirements
- Synchronized audio control between host and current player

## Game Flow

### 1. Game Setup
- Host creates room and receives unique lobby code
- Players join via mobile devices using lobby code or QR scan
- Host can see all connected players as colorful cassette tape players

### 2. Gameplay
- Host starts the game, initializing with 20 optimized songs with working audio previews
- Each player receives a random starting song for their timeline
- Game presents mystery songs one at a time via spinning record player
- Current player listens to 30-second preview and places song on their timeline
- Points awarded for correct chronological placement
- Incorrect placements remove the song from the timeline

### 3. Victory
- First player to reach 10 correctly placed songs wins
- Victory screen displays with celebration effects
- Game statistics and final timelines shown

## Technical Features

### Performance Optimizations
- 20-song playlist with pre-validated audio previews to prevent API failures
- Efficient real-time subscription management with automatic retry
- Mobile-first responsive design with touch-optimized controls
- Lazy loading of audio resources and images

### Reliability Features
- Exponential backoff for failed network requests
- Automatic reconnection with visual status indicators
- Error boundaries for graceful error handling
- Network status monitoring and offline detection

### Accessibility
- Mobile-responsive design for all screen sizes
- High contrast colors and clear typography
- Touch-friendly interface elements
- Audio controls with visual feedback

## Development Setup

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Build optimized production bundle
npm run build

# Run type checking
npm run type-check
```

## Technologies Used

- **Frontend**: React 18 + TypeScript + Vite for fast development and builds
- **Styling**: Tailwind CSS + shadcn/ui for consistent, accessible components
- **Backend**: Supabase for real-time database, authentication, and edge functions
- **State Management**: TanStack React Query for server state and caching
- **Audio**: Deezer API integration for music previews and metadata
- **Real-time**: Supabase Realtime for live multiplayer synchronization
- **Build**: Vite with TypeScript, ESLint, and PostCSS

## Deployment

Deploy instantly via [Lovable](https://lovable.dev/projects/f0f391ce-3307-4d50-ad92-9e1d2ad743e1):
1. Click Share → Publish for automatic deployment
2. Custom domain configuration available in project settings
3. Environment variables managed through Supabase dashboard

## Game Design Philosophy

Timeliner bridges the gap between digital gaming and social interaction by requiring players to use their mobile devices while sharing a communal host display. This creates an engaging party atmosphere where music knowledge becomes a social currency, and the visual feedback system keeps all players engaged even when it's not their turn.

The game celebrates music history and encourages discovery of songs across different eras, making it both entertaining and educational. The real-time multiplayer architecture ensures smooth gameplay even with network interruptions, while the audio-visual design creates an immersive retro gaming experience.
