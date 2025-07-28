# Rythmy Game - Complete Documentation

## Overview

Rythmy is a music timeline challenge game where players arrange songs in chronological order. This documentation provides a comprehensive overview of all files, their functionality, categories, and relationships within the codebase.

## Architecture Overview

```
Rythmy Game Architecture
├── Client-Side (React/TypeScript)
│   ├── UI Components (Player/Host Views)
│   ├── Game Logic & State Management
│   ├── Animation System (GSAP-based)
│   └── Responsive Design System
├── Backend Services (Supabase)
│   ├── Real-time Database
│   ├── Authentication
│   └── Real-time Subscriptions
└── External Services
    ├── Deezer API (Music Data)
    └── Audio Streaming
```

## File Categories and Relationships

### 1. Core Application Files

#### `src/main.tsx`
- **Purpose**: Application entry point
- **Dependencies**: React, ReactDOM
- **Relationships**: Bootstraps App.tsx
- **Key Features**:
  - React 18 concurrent features setup
  - Global error boundary initialization
  - CSS imports and theme loading

#### `src/App.tsx`
- **Purpose**: Root application component and routing
- **Dependencies**: React Router, Authentication hooks
- **Relationships**: Contains all major page components
- **Key Features**:
  - Client-side routing configuration
  - Global state providers
  - Authentication wrapper
  - Theme and viewport management

#### `src/App.css` & `src/index.css`
- **Purpose**: Global styles and Tailwind CSS configuration
- **Dependencies**: Tailwind CSS, CSS custom properties
- **Relationships**: Used by all components
- **Key Features**:
  - CSS custom properties for responsive design
  - Animation keyframes definitions
  - Global utility classes

### 2. Page Components

#### `src/pages/GamePlay.tsx`
- **Purpose**: Main game interface controller
- **Dependencies**: All game components, hooks
- **Relationships**: Routes to Host/Player views based on role
- **Key Features**:
  - Game state orchestration
  - Component selection (host vs player)
  - Audio manager initialization
  - Error boundary integration

### 3. Core Game Components

#### Host View Components

##### `src/components/host/ResponsiveHostView.tsx`
- **Purpose**: Modern responsive host interface
- **Dependencies**: Character/Cassette managers, animation system
- **Relationships**: Used by GamePlay.tsx for host role
- **Key Features**:
  - Three-section header layout (logo, cassette, room info)
  - Random cassette selection system
  - Character-based player representation
  - Real-time card placement feedback
  - Responsive grid layout for multiple players

##### `src/components/host/HostGameView.tsx`
- **Purpose**: Legacy host game interface
- **Dependencies**: Player timeline components
- **Relationships**: Fallback for ResponsiveHostView
- **Status**: Legacy - being phased out

##### `src/components/host/HostHeader.tsx`
- **Purpose**: Host view header component
- **Dependencies**: UI components, room data
- **Relationships**: Used by host view components
- **Key Features**:
  - Room code display
  - Player count indicator
  - Game phase status

##### `src/components/host/HostGameBackground.tsx`
- **Purpose**: Animated background for host view
- **Dependencies**: Animation system
- **Relationships**: Background layer for host components
- **Key Features**:
  - Dynamic gradient animations
  - Particle effects
  - Performance-optimized rendering

##### `src/components/host/HostGameOverScreen.tsx`
- **Purpose**: Game completion screen for hosts
- **Dependencies**: Victory animations, player data
- **Relationships**: Shown when game ends
- **Key Features**:
  - Winner announcement
  - Final scores display
  - Replay functionality

#### Player View Components

##### `src/components/player/ResponsiveMobilePlayerView.tsx`
- **Purpose**: Complete mobile-first player interface
- **Dependencies**: Responsive manager, character selection, animations
- **Relationships**: Primary player interface used by GamePlay.tsx
- **Key Features**:
  - Fully responsive viewport-based scaling
  - Touch-optimized interactions (44px+ touch targets)
  - iPhone safe area support (notch, dynamic island)
  - Enhanced playback controls
  - Smart timeline navigation with horizontal scrolling
  - Character integration in footer
  - Zero horizontal overflow design

##### `src/components/player/MobilePlayerGameView.tsx`
- **Purpose**: Legacy mobile player interface
- **Dependencies**: Basic game components
- **Relationships**: Backup for ResponsiveMobilePlayerView
- **Status**: Legacy - replaced by ResponsiveMobilePlayerView

##### `src/components/player/MobileVictoryScreen.tsx`
- **Purpose**: Victory screen for mobile players
- **Dependencies**: Character assets, animations
- **Relationships**: Shown when player wins
- **Key Features**:
  - Character-specific victory animations
  - Score celebration effects
  - Social sharing integration

##### `src/components/player/MobileGameOverScreen.tsx`
- **Purpose**: Game over screen for mobile players
- **Dependencies**: Final score data
- **Relationships**: Shown when game ends without winning
- **Key Features**:
  - Performance summary
  - Final timeline display
  - Replay encouragement

### 4. Specialized Game Components

#### `src/components/CharacterSelection.tsx`
- **Purpose**: Character selection interface
- **Dependencies**: Character manager, local storage
- **Relationships**: Used in mobile lobby and player setup
- **Key Features**:
  - Three unique characters (Mike, Steve, Villudrillu)
  - Session persistence via localStorage
  - Touch-friendly selection interface
  - Character preview system
  - Fallback image handling

#### `src/components/CardPlacementAnimations.tsx`
- **Purpose**: Advanced card placement animation system
- **Dependencies**: GSAP animation system, Song types
- **Relationships**: Used by both host and player views
- **Key Features**:
  - Enhanced card falling animations (correct/incorrect)
  - GPU-accelerated transforms for 60fps performance
  - Interruptible animation sequences
  - Visual feedback systems (sparkles, smoke effects)
  - Timeline highlighting during placement
  - Performance scaling for different devices

#### `src/components/EnhancedMysteryCard.tsx` & `src/components/MysteryCard.tsx`
- **Purpose**: Mystery card display components
- **Dependencies**: Song data, animation system
- **Relationships**: Used in game play interfaces
- **Key Features**:
  - Dynamic card generation from song data
  - Artist-based color generation
  - Preview audio integration
  - Reveal animations

#### `src/components/AudioPlayer.tsx`
- **Purpose**: Game audio playback controller
- **Dependencies**: Audio manager, song data
- **Relationships**: Used across all game interfaces
- **Key Features**:
  - Deezer preview URL playback
  - Cross-device audio synchronization
  - Playback state management
  - Error handling for failed audio

### 5. UI Infrastructure Components

#### `src/components/ui/` (Shadcn/ui Components)
- **Purpose**: Reusable UI component library
- **Dependencies**: Radix UI primitives, Tailwind CSS
- **Relationships**: Used throughout the application
- **Components Include**:
  - Button, Input, Card, Dialog
  - Toast notifications
  - Form components
  - Navigation elements

#### `src/components/ErrorBoundary.tsx` & `src/components/GameErrorBoundary.tsx`
- **Purpose**: Error boundary components for crash recovery
- **Dependencies**: React error boundary API
- **Relationships**: Wrap major component trees
- **Key Features**:
  - Graceful error handling
  - User-friendly error messages
  - Recovery suggestions
  - Error reporting integration

#### `src/components/LoadingScreen.tsx`
- **Purpose**: Application loading interface
- **Dependencies**: Animation system
- **Relationships**: Shown during app initialization
- **Key Features**:
  - Branded loading animations
  - Progress indicators
  - Responsive design

### 6. Game Logic and State Management

#### Core Hooks

##### `src/hooks/useGameLogic.tsx`
- **Purpose**: Central game state management
- **Dependencies**: Game service, playlist service
- **Relationships**: Used by GamePlay.tsx
- **Key Features**:
  - Player state synchronization
  - Game phase management (loading, ready, playing, finished)
  - Song pool management (20 songs with previews)
  - Winner detection logic
  - API performance optimization

##### `src/hooks/useEnhancedTurnManager.tsx`
- **Purpose**: Advanced turn management with animations
- **Dependencies**: TurnManager, animation system
- **Relationships**: Integrates with ResponsiveMobilePlayerView
- **Key Features**:
  - Coordinated turn transitions
  - Animation state management
  - Mystery card validation
  - Error recovery mechanisms

##### `src/hooks/useGameRoom.tsx`
- **Purpose**: Room state and real-time synchronization
- **Dependencies**: Supabase client, real-time subscriptions
- **Relationships**: Used by game components
- **Key Features**:
  - Real-time player updates
  - Room state synchronization
  - Connection management
  - Database query optimization

##### `src/hooks/useRealtimeSubscription.tsx`
- **Purpose**: Supabase real-time connection management
- **Dependencies**: Supabase real-time client
- **Relationships**: Used by useGameRoom
- **Key Features**:
  - Connection state tracking
  - Automatic reconnection
  - Subscription lifecycle management
  - Error handling and recovery

#### Specialized Game Logic Hooks

##### `src/hooks/useClassicGameLogic.tsx`
- **Purpose**: Classic game mode implementation
- **Dependencies**: GameService, song management
- **Relationships**: Alternative to useGameLogic
- **Key Features**:
  - Traditional turn-based gameplay
  - Card placement validation
  - Score calculation
  - Game completion detection

##### `src/hooks/useFiendGameLogic.tsx` & `src/hooks/useSprintGameLogic.tsx`
- **Purpose**: Alternative game mode implementations
- **Dependencies**: Specialized game rules
- **Relationships**: Used for game mode variations
- **Status**: Extended gameplay modes

### 7. Service Layer

#### `src/services/gameService.ts`
- **Purpose**: Core game logic and database operations
- **Dependencies**: Supabase client, game types
- **Relationships**: Used by all game logic hooks
- **Key Features**:
  - **Enhanced Mystery Card Selection**: Improved song selection with preview URL prioritization
  - **Comprehensive Turn Management**: Enhanced logging and validation
  - **Player Timeline Management**: Chronological validation and updates
  - **Game State Persistence**: Database synchronization
  - **Emergency Fallback Systems**: Robust error recovery
  - **Song Pool Management**: Dynamic available song tracking

#### `src/services/AudioManager.ts`
- **Purpose**: Audio playback coordination
- **Dependencies**: Web Audio API, Deezer service
- **Relationships**: Used by audio components
- **Key Features**:
  - Cross-device audio synchronization
  - Preview URL management
  - Playback state coordination
  - Error handling for audio failures

#### `src/services/DeezerAudioService.ts`
- **Purpose**: Deezer API integration
- **Dependencies**: Deezer SDK
- **Relationships**: Used by playlist and audio services
- **Key Features**:
  - Song search and retrieval
  - Preview URL extraction
  - API rate limiting
  - Error handling and retries

#### `src/services/defaultPlaylistService.ts`
- **Purpose**: Default song playlist management
- **Dependencies**: Deezer service, song validation
- **Relationships**: Used by game logic for song loading
- **Key Features**:
  - Optimized song loading (20 songs with previews)
  - Preview URL validation
  - API performance optimization
  - Fallback song selection

#### `src/services/RandomSongService.ts`
- **Purpose**: Random song generation for testing
- **Dependencies**: Sample song data
- **Relationships**: Used for development and testing
- **Key Features**:
  - Sample song database (30+ songs)
  - Random timeline generation
  - Testing utilities

### 8. Advanced Systems

#### Animation System

##### `src/lib/animations.ts`
- **Purpose**: Centralized animation management system
- **Dependencies**: Web Animations API, GSAP concepts
- **Relationships**: Used by all animation components
- **Key Features**:
  - **GPU-Accelerated Animations**: Hardware acceleration for 60fps performance
  - **Enhanced Card Animations**: Sophisticated card falling, placement, and transition effects
  - **Turn Management Integration**: Coordinated animations for turn changes
  - **Mobile Optimization**: Touch-friendly animations with performance scaling
  - **Interruptible Sequences**: Animations can be stopped and restarted seamlessly
  - **Memory Management**: Automatic cleanup prevents memory leaks

##### `src/lib/AnimationManager.ts`
- **Purpose**: Animation instance management
- **Dependencies**: Animation definitions, performance monitoring
- **Relationships**: Used by animation components
- **Key Features**:
  - Animation lifecycle management
  - Performance monitoring
  - Device capability detection
  - Reduced motion support

##### `src/lib/TurnManager.ts`
- **Purpose**: Enhanced turn management with animation coordination
- **Dependencies**: GameService, animation system
- **Relationships**: Used by enhanced turn hook
- **Key Features**:
  - **Coordinated Turn Transitions**: Seamless integration of game logic and animations
  - **Phase Management**: Turn transitions broken into manageable phases
  - **Mystery Card System Validation**: Comprehensive validation of song selection system
  - **Animation State Tracking**: Real-time animation progress monitoring
  - **Error Recovery**: Robust fallback mechanisms for turn failures

#### Responsive Design System

##### `src/lib/ResponsiveManager.ts`
- **Purpose**: Responsive design and viewport management
- **Dependencies**: CSS custom properties, device detection
- **Relationships**: Used by responsive components
- **Key Features**:
  - Real-time viewport tracking
  - iPhone safe area support (notch, dynamic island)
  - Automatic CSS custom property updates
  - Device classification (mobile/tablet/desktop)
  - Orientation change handling

##### `src/lib/viewport.ts`
- **Purpose**: Viewport utility functions
- **Dependencies**: Browser APIs
- **Relationships**: Used by responsive manager
- **Key Features**:
  - Viewport dimension calculations
  - Safe area inset detection
  - Orientation change detection

#### Character and Asset Management

##### `src/lib/CharacterManager.ts`
- **Purpose**: Character selection and persistence
- **Dependencies**: localStorage, character assets
- **Relationships**: Used by character selection components
- **Key Features**:
  - Session persistence (localStorage)
  - Character image path management
  - Fallback character handling
  - Character-based player identification

##### `src/lib/CassetteManager.ts`
- **Purpose**: Dynamic cassette player asset management
- **Dependencies**: Cassette assets
- **Relationships**: Used by host view components
- **Key Features**:
  - Random cassette selection
  - Asset preloading
  - Fallback cassette handling

### 9. Type Definitions

#### `src/types/game.ts`
- **Purpose**: Central type definitions for game entities
- **Dependencies**: None (pure TypeScript)
- **Relationships**: Used throughout the application
- **Key Types**:
  - `Song`: Music track data structure
  - `Player`: Player state and timeline
  - `GameRoom`: Room configuration and state
  - `GamePhase`: Game state enumeration

### 10. Integration Layer

#### `src/integrations/supabase/`
- **Purpose**: Supabase database integration
- **Dependencies**: Supabase client SDK
- **Relationships**: Used by all database operations
- **Key Features**:
  - Type-safe database client
  - Real-time subscription management
  - Authentication integration
  - Database schema definitions

### 11. Utility Functions

#### `src/lib/utils.ts`
- **Purpose**: Common utility functions
- **Dependencies**: clsx, tailwind-merge
- **Relationships**: Used throughout components
- **Key Functions**:
  - `cn`: Class name merging
  - `getArtistColor`: Artist-based color generation
  - `truncateText`: Text truncation utilities

#### `src/utils/constants.ts`
- **Purpose**: Application constants
- **Dependencies**: None
- **Relationships**: Used for configuration values
- **Key Constants**:
  - Game configuration
  - API endpoints
  - Default values

#### `src/utils/validation.ts`
- **Purpose**: Data validation utilities
- **Dependencies**: Type definitions
- **Relationships**: Used by forms and data processing
- **Key Features**:
  - Song data validation
  - Player data validation
  - Room code validation

### 12. Development and Testing

#### `src/utils/testing.ts`
- **Purpose**: Testing utilities and helpers
- **Dependencies**: Testing frameworks
- **Relationships**: Used in test files
- **Key Features**:
  - Mock data generation
  - Test setup utilities
  - Component testing helpers

## Key System Relationships

### Game Flow Architecture
```
User Action (Card Placement)
    ↓
Enhanced Turn Manager
    ↓
Animation System (Card Falling)
    ↓
Game Service (Database Update)
    ↓
Real-time Sync (All Clients)
    ↓
Turn Transition Animation
    ↓
Next Player Ready
```

### Data Flow Architecture
```
Deezer API → Default Playlist Service → Game Logic Hooks
                                           ↓
Player Actions → Game Service → Supabase Database
                                           ↓
Real-time Subscriptions → All Connected Clients
```

### Animation Coordination
```
Turn Manager → Animation Manager → Web Animations API
     ↓              ↓                    ↓
State Updates → Component Updates → DOM Animations
```

## Performance Optimizations

### 1. Song Loading Strategy
- Load 20 songs with working preview URLs upfront
- Validate preview URLs during loading
- Filter out songs without audio
- Prioritize songs with preview URLs for mystery card selection

### 2. Animation Performance
- GPU acceleration for all card animations
- Performance scaling based on device capabilities
- Reduced motion support for accessibility
- Memory cleanup to prevent leaks

### 3. Real-time Optimization
- Debounced viewport updates
- Efficient re-rendering patterns
- Connection state management
- Automatic reconnection logic

### 4. Mobile Optimization
- Touch-friendly interactions (44px+ targets)
- Viewport-based scaling
- Safe area handling
- Optimized asset loading

## Error Handling Strategy

### 1. Turn Management Errors
- Emergency card selection fallbacks
- Graceful animation failures
- Turn state recovery mechanisms
- User notification system

### 2. Network Errors
- Automatic reconnection
- Offline state handling
- Data synchronization recovery
- User feedback for connection issues

### 3. Audio Errors
- Preview URL fallbacks
- Silent error handling
- User notification for audio issues
- Alternative playback methods

## Future Extensibility

### 1. Game Mode Extensions
- Framework for additional game modes
- Pluggable game logic system
- Configurable rule sets

### 2. Animation System Extensions
- Additional animation presets
- Custom animation sequences
- Performance profiling tools

### 3. Character System Extensions
- Additional character assets
- Character customization
- Character-specific abilities

This documentation provides a complete overview of the Rythmy game codebase, covering all files, their relationships, and the sophisticated systems that enable smooth, responsive gameplay across all devices.