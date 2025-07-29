# Song Timeline Tunes - Technical Documentation

## Overview

Song Timeline Tunes (also known as "Rythmy") is a real-time multiplayer music timeline game built with React, TypeScript, and Supabase. Players guess when songs were released and organize them chronologically on their personal timelines. The game features a host/player architecture where the host displays the game on a large screen while players join via mobile devices, creating an engaging party game experience.

## Project Architecture

### Technology Stack
- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5.4
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: shadcn/ui component library
- **Backend**: Supabase (PostgreSQL database with real-time subscriptions)
- **State Management**: React Query for server state, React hooks for local state
- **Routing**: React Router DOM
- **Audio**: Web Audio API integration
- **Package Manager**: npm (with bun.lockb for faster installs)

### Game Architecture
The application follows a client-server architecture with real-time synchronization:
- **Host Interface**: Large screen display showing game state, player timelines, and mystery songs
- **Player Interface**: Mobile-optimized interface for joining games and placing cards
- **Real-time Sync**: Supabase real-time subscriptions for live multiplayer functionality
- **Audio Integration**: Background music and sound effects system

## Complete Project Structure

### Root Configuration Files

````typescript
// package.json - Project dependencies and scripts
{
  "name": "vite_react_shadcn_ts",
  "scripts": {
    "dev": "vite",           // Development server
    "build": "vite build",   // Production build
    "lint": "eslint .",      // Code linting
    "preview": "vite preview" // Preview production build
  }
}
````

- **tsconfig.json**: Main TypeScript configuration with path mapping (`@/*` → `./src/*`)
- **tsconfig.app.json**: Application-specific TypeScript settings
- **tsconfig.node.json**: Node.js specific TypeScript configuration
- **vite.config.ts**: Vite build configuration with React plugin and path resolving
- **tailwind.config.ts**: Tailwind CSS configuration with custom theme and animations
- **eslint.config.js**: ESLint rules for code quality and consistency
- **postcss.config.js**: PostCSS configuration for CSS processing
- **components.json**: shadcn/ui component configuration
- **.gitignore**: Git ignore patterns for build artifacts and dependencies

### Entry Points

- **index.html**: Main HTML entry point with root div and Vite script loading
- **src/main.tsx**: Application bootstrap, initializes viewport height and renders React app
- **src/App.tsx**: Root React component with routing, providers, and global UI components

### Core Application Pages

````typescript
// src/pages/Index.tsx - Main game orchestration page
// Manages:
- Game phase transitions (menu → lobby → playing → finished)
- Room state and player connections
- Integration between host and player views
- Sound effects coordination
- Auto-join functionality from QR codes
````

- **src/pages/NotFound.tsx**: 404 error page for invalid routes

### Game Logic & State Management

````typescript
// src/hooks/useGameLogic.tsx - Core game mechanics
// Responsibilities:
- Turn management and player rotation
- Song selection from available playlists
- Scoring logic and correctness validation
- Win condition checking (first to 10 songs)
- Card placement validation
- Game phase transitions
````

````typescript
// src/hooks/useGameRoom.tsx - Real-time room management
// Features:
- Supabase integration for persistent room state
- Player synchronization across devices  
- Real-time event broadcasting
- Connection handling and recovery
- Room creation and joining logic
- Player management (kick, update, etc.)
````

````typescript
// src/hooks/useRealtimeSubscription.tsx - Robust real-time system
// Capabilities:
- Automatic reconnection with exponential backoff
- Network status monitoring
- Subscription cleanup and management
- Error handling and retry logic
- Connection state broadcasting
````

````typescript
// src/hooks/useSoundEffects.tsx - Audio feedback system
// Sound Events:
- Card placement and movement sounds
- Success/error feedback audio
- Victory celebration music
- Player join notifications
- Turn transition sounds
- Background music management
````

### Game Components

#### Core Game Flow Components

````typescript
// src/components/GamePlay.tsx - Main game orchestration
// Coordinates:
- Host vs player view rendering
- Audio playback control
- Game state transitions
- Turn management
- Victory condition handling
````

````typescript
// src/components/MainMenu.tsx - Initial game interface
// Features:
- Host game creation
- Join game by code
- Game mode selection
- Quick start options
````

````typescript
// src/components/VictoryScreen.tsx - End game celebration
// Elements:
- Winner announcement with confetti effects
- Final score display
- Play again options
- Return to menu functionality
````

#### Host Components (Large Screen Display)

````typescript
// src/components/HostVisuals.tsx - Complete host interface
// Components:
- Record player with spinning animation
- Player cassette displays
- Timeline visualizations
- Current song information
- Game status indicators
````

````typescript
// src/components/HostLobby.tsx - Pre-game host management
// Features:
- Room code display with QR code
- Player list with kick functionality
- Game settings configuration
- Playlist management
- Game start controls
````

````typescript
// src/components/RecordMysteryCard.tsx - Animated record player
// Animations:
- Spinning record disc
- Needle arm movement
- Song metadata display
- Audio visualization effects
````

````typescript
// src/components/CassettePlayerDisplay.tsx - Player representations
// Visual Elements:
- Unique cassette colors per player
- Player name and character display
- Timeline progress indicators
- Score and status information
````

#### Player Components (Mobile Interface)

````typescript
// src/components/MobileJoin.tsx - Mobile room joining
// Interface:
- Room code input with validation
- Auto-focus and keyboard optimization
- Error handling and feedback
- Loading states
````

````typescript
// src/components/MobilePlayerLobby.tsx - Mobile pre-game lobby
// Display:
- Other players list
- Game status information
- Character selection
- Ready status indicators
````

````typescript
// src/components/player/MobilePlayerGameView.tsx - Mobile gameplay interface
// Functionality:
- Personal timeline management
- Card drag-and-drop placement
- Mystery song audio controls
- Score and progress tracking
- Turn indicators
````

````typescript
// src/components/MysteryCard.tsx - Mobile song card component
// Features:
- Song metadata display
- Audio play/pause controls
- Drag gesture handling
- Placement confirmation UI
````

#### Shared UI Components

````typescript
// src/components/QRCodeGenerator.tsx - QR code generation
// Generates QR codes for easy mobile joining
// Includes fallback room code display
````

````typescript
// src/components/ConnectionStatus.tsx - Real-time connection monitoring
// Features:
- Connection status indicators (connected/disconnecting/reconnecting)
- Manual reconnection controls
- Network quality indicators
- Error state display
````

````typescript
// src/components/ErrorBoundary.tsx - Global error handling
// Capabilities:
- Graceful error recovery
- Error reporting and logging
- Fallback UI rendering
- Development error details
````

````typescript
// src/components/GameErrorBoundary.tsx - Game-specific error handling
// Features:
- Game state recovery
- Retry functionality
- Error context preservation
- User-friendly error messages
````

### Game Mode Implementations

````typescript
// src/hooks/useClassicGameLogic.tsx - Classic game mode
// Rules:
- Turn-based card placement
- First to 10 songs wins
- Standard scoring system
- Traditional timeline progression
````

````typescript
// src/hooks/useFiendGameLogic.tsx - Fiend mode (advanced)
// Features:
- Configurable round limits
- Enhanced difficulty mechanics
- Advanced scoring algorithms
- Power-up integration potential
````

````typescript
// src/hooks/useSprintGameLogic.tsx - Sprint mode (fast-paced)
// Mechanics:
- Time-limited rounds
- Rapid card placement
- Target card count goals
- Speed-based scoring bonuses
````

### Data Models and Types

````typescript
// src/types/game.ts - Core game type definitions
export type GamePhase = 'menu' | 'hostLobby' | 'mobileJoin' | 'mobileLobby' | 'playing' | 'finished';
export type GameMode = 'classic' | 'fiend' | 'sprint';

export interface GameState {
  phase: GamePhase;
  currentTurn: number;
  currentSong: Song | null;
  timeLeft: number;
  isPlaying: boolean;
  // ... additional state properties
}

export interface Song {
  id: string;
  deezer_title: string;
  deezer_artist: string;
  release_year: number;
  preview_url?: string;
  // ... metadata properties
}

export interface Player {
  id: string;
  name: string;
  room_id: string;
  timeline: Song[];
  character: string;
  is_host: boolean;
  // ... player properties
}
````

````typescript
// src/integrations/supabase/types.ts - Database schema types
// Auto-generated from Supabase schema
// Includes: game_rooms, players, game_moves tables
````

### Services Layer

````typescript
// src/services/gameService.ts - Core game operations
// Functions:
- initializeGameWithStartingCards()
- createGameRoom()
- addPlayerToRoom()  
- updatePlayerTimeline()
- broadcastGameEvent()
- calculatePlayerScore()
````

````typescript
// src/services/defaultPlaylistService.ts - Music data management
// Capabilities:
- Song library loading and caching
- Playlist generation and filtering
- Song metadata enrichment
- Audio preview URL management
````

````typescript
// src/services/DeezerAudioService.ts - Audio integration
// Features:
- Deezer API integration
- Audio streaming management
- Preview playback controls
- Audio quality optimization
````

````typescript
// src/services/websocketService.ts - Real-time communication
// Handles:
- WebSocket connection management
- Message serialization/deserialization
- Connection retry logic
- Event broadcasting
````

### Utility Libraries

````typescript
// src/lib/utils.ts - Common utility functions
// Contains:
- CSS class merging (cn function)
- Data transformation helpers
- Validation utilities
- Common type guards
````

````typescript
// src/lib/SoundEffects.ts - Audio management utilities
// Features:
- Sound file loading and caching
- Volume control and mixing
- Audio context management
- Browser compatibility handling
````

````typescript
// src/lib/animations.ts - Animation utilities
// Includes:
- CSS animation helpers
- Transition timing functions
- Animation state management
- Performance optimization
````

````typescript
// src/lib/viewport.ts - Mobile viewport handling
// Functions:
- initializeViewportHeight() - fixes mobile 100vh issues
- Responsive design utilities
- Touch interaction optimizations
````

### Constants and Configuration

````typescript
// src/constants/characters.ts - Player character system
// Exports:
- Character definitions with names and images
- Default character assignment logic
- Character color mappings
- Avatar system integration
````

### Styling System

````css
/* src/styles/design-system.css - Design tokens and variables */
/* Defines:
- Color palette and themes
- Typography scale
- Spacing system
- Component base styles
- CSS custom properties
*/
````

````css
/* src/styles/animations.css - Animation definitions */
/* Includes:
- Card placement animations
- Loading state animations  
- Transition effects
- Hover and focus states
- Mobile gesture animations
*/
````

````css
/* src/index.css - Global styles and Tailwind imports */
/* Contains:
- Tailwind CSS imports
- Global reset styles
- Root element styling
- Mobile-specific adjustments
*/
````

### Static Assets

#### Public Directory Structure
- **public/sounds/**: Audio files for game sound effects
  - `card-place.mp3`, `card-throw.mp3` - Card interaction sounds
  - `correct.mp3`, `incorrect.mp3` - Feedback sounds
  - `victory.mp3`, `game-start.mp3` - Game state sounds
  - `player-join.mp3`, `turn-transition.mp3` - Social sounds
- **public/*.png**: Game assets (vinyl records, character images, cassette tapes)
- **public/demo.html**: Standalone demo files for testing
- **public/favicon.ico**: Browser favicon
- **public/robots.txt**: SEO and crawler instructions

## File Relationships and Dependencies

### Core Dependency Flow

````
src/main.tsx
├── src/App.tsx (routing & providers)
│   ├── src/pages/Index.tsx (main orchestrator)
│   │   ├── src/hooks/useGameRoom.tsx (room state)
│   │   ├── src/hooks/useGameLogic.tsx (game mechanics)
│   │   ├── src/hooks/useSoundEffects.tsx (audio)
│   │   └── src/components/* (UI components)
│   └── src/pages/NotFound.tsx
├── src/lib/viewport.ts (mobile setup)
└── CSS imports (styling system)
````

### Real-time Data Flow

````
Supabase Database
├── game_rooms table
├── players table  
└── game_moves table
    ↓
src/integrations/supabase/client.ts
    ↓
src/hooks/useRealtimeSubscription.tsx
    ↓
src/hooks/useGameRoom.tsx
    ↓
src/pages/Index.tsx
    ↓
Component Tree (Host/Player Views)
````

### Component Hierarchy

````
src/pages/Index.tsx
├── src/components/MainMenu.tsx
├── src/components/HostLobby.tsx
│   ├── src/components/QRCodeGenerator.tsx
│   └── Player management UI
├── src/components/MobileJoinFlow.tsx
│   ├── src/components/MobileJoin.tsx
│   └── src/components/MobilePlayerLobby.tsx
├── src/components/GamePlay.tsx
│   ├── src/components/HostVisuals.tsx
│   │   ├── src/components/RecordMysteryCard.tsx
│   │   └── src/components/CassettePlayerDisplay.tsx
│   └── src/components/player/MobilePlayerGameView.tsx
│       └── src/components/MysteryCard.tsx
└── src/components/VictoryScreen.tsx
````

## Technical Implementation Details

### Event Handling System

The game uses a multi-layered event system:

1. **Local Events**: React synthetic events for UI interactions
2. **Game Events**: Custom events for game state changes
3. **Real-time Events**: Supabase real-time subscriptions for multiplayer sync
4. **Audio Events**: Web Audio API events for sound management

### State Management Architecture

````typescript
// Layered state management approach:

// 1. Local Component State (useState)
// For UI-specific state that doesn't need to be shared

// 2. Custom Hooks (useGameLogic, useGameRoom)  
// For complex business logic and cross-component state

// 3. React Query (server state)
// For data fetching, caching, and synchronization

// 4. Supabase Real-time (distributed state)
// For multiplayer state synchronization across clients
````

### CSS Modularity and Design System

The styling system is built on multiple layers:

1. **Tailwind CSS**: Utility-first CSS framework for rapid development
2. **shadcn/ui**: Pre-built, accessible component library
3. **Custom Design System**: Consistent tokens in `src/styles/design-system.css`
4. **Animation System**: Reusable animations in `src/styles/animations.css`
5. **Component-specific Styles**: Scoped CSS modules where needed

### Mobile Optimization

- **Viewport Handling**: Custom viewport height calculation for mobile browsers
- **Touch Interactions**: Optimized drag-and-drop for card placement
- **Responsive Design**: Mobile-first approach with progressive enhancement
- **Performance**: Lazy loading and code splitting for mobile networks

### Error Handling Strategy

````typescript
// Multi-level error handling:

// 1. Component Level: ErrorBoundary components
try {
  // Component logic
} catch (error) {
  // Local error handling
}

// 2. Hook Level: Error states in custom hooks
const [error, setError] = useState<string | null>(null);

// 3. Service Level: Try-catch in async operations
// 4. Global Level: Window error handlers and reporting
````

### Performance Optimizations

- **Code Splitting**: Dynamic imports for route-based splitting
- **Memoization**: React.memo and useMemo for expensive computations
- **Debouncing**: Input handling and API calls
- **Lazy Loading**: Components and assets loaded on demand
- **Caching**: React Query for server state caching
- **Bundle Analysis**: Vite bundle analyzer for optimization insights

## Game Flow Description

### Expanded Game Flow

#### 1. Application Initialization
- Viewport height calculation for mobile compatibility
- React app mounting with error boundaries
- Service worker registration (if configured)
- Global event listeners setup

#### 2. Main Menu Phase
- User chooses to host or join a game
- Host option: Creates new room and transitions to host lobby
- Join option: Shows mobile join interface with room code input
- Demo mode: Access to standalone game demonstrations

#### 3. Host Lobby Phase
- Room creation with unique code generation
- QR code generation for easy mobile joining
- Player management interface (view, kick players)
- Game settings configuration (mode, playlist, etc.)
- Real-time player list updates as users join
- Game start validation (minimum players, etc.)

#### 4. Mobile Join Phase
- Room code entry with validation
- Player name selection with character assignment
- Auto-join via QR code scanning
- Connection establishment with room validation
- Error handling for invalid codes or full rooms

#### 5. Mobile Lobby Phase
- Wait for host to start game
- View other players and their characters
- Real-time updates of lobby state
- Ready status indicators
- Kick notification handling

#### 6. Game Playing Phase

**Initialization:**
- Starting card distribution to all players
- Playlist loading and song selection
- Audio system initialization
- Timer and turn management setup

**Turn Progression:**
- Mystery song selection and broadcast
- Audio playback with preview controls
- Player card placement with validation
- Correctness checking and scoring
- Timeline update and synchronization
- Turn transition with animations

**Real-time Synchronization:**
- Host view updates with all player timelines
- Player mobile views show personal progress
- Live audio synchronization across devices
- Connection monitoring and recovery

#### 7. Victory Conditions
- First player to reach target (10 songs in classic mode)
- Alternative win conditions based on game mode
- Winner announcement with celebration effects
- Final score calculation and leaderboard

#### 8. Post-Game Phase
- Victory screen with confetti animations
- Play again options with room persistence
- Return to menu functionality
- Score sharing and social features

### Multiplayer Synchronization

The real-time multiplayer system handles:
- **State Consistency**: All clients maintain synchronized game state
- **Conflict Resolution**: Handles simultaneous actions gracefully
- **Network Resilience**: Automatic reconnection and state recovery
- **Latency Compensation**: Optimistic updates with rollback capability
- **Connection Management**: Graceful handling of player disconnections

This comprehensive technical documentation provides a complete overview of the Song Timeline Tunes codebase, architecture, and implementation details for developers working on the project.