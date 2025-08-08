# Migration Notes - Game Orchestration and Type Safety Updates

## Overview

This update consolidates game orchestration, improves type safety, and unifies several components to reduce code duplication and improve maintainability.

## Key Changes

### 1. Game Orchestration Consolidation

**Before**: Game logic was split between `Game.tsx`, `GamePlay.tsx`, and pages
**After**: All game orchestration is now centralized in `components/Game.tsx`

- **Game.tsx** - Central orchestrator for all game flow, state management, feedback, and audio control
- **GamePlay.tsx** - Reduced to presentational component, receives orchestration state as props
- **pages/Index.tsx** - Remains minimal (unchanged)

### 2. Type-Safe GamePhase Constants

**Before**: String literals like `'playing'`, `'finished'` scattered throughout code
**After**: Type-safe constants and helpers

```typescript
// Old usage
phase === 'playing'

// New usage  
phase === GamePhase.PLAYING

// New helpers available
canTransitionTo(GamePhase.MENU, GamePhase.HOST_LOBBY) // returns boolean
isHostPhase(phase) // returns boolean
isPlayerPhase(phase) // returns boolean
```

### 3. Unified JoinForm Component

**Before**: Separate `MobileJoin.tsx` and `PlayerJoinForm.tsx` with duplicate logic
**After**: Single `JoinForm.tsx` component with variant prop

```typescript
// Mobile variant (full page join)
<JoinForm variant="mobile" onSubmit={handleJoinRoom} onBackToMenu={handleBack} />

// Host variant (simple name entry)  
<JoinForm variant="host" onSubmit={handleNameEntry} />
```

### 4. Enhanced GameService Interface

**Before**: Static class with inconsistent method signatures
**After**: Implements `IGameService` interface with zod validation

```typescript
// All methods now validate inputs using zod schemas
await GameService.placeCard(roomId, playerId, song, position)
// Throws validation errors for invalid UUIDs, songs, etc.
```

### 5. Unified Realtime Service

**Before**: Multiple websocket services (`reliableWebSocketService.ts`, `realtimeManager.ts`, etc.)
**After**: Single `ReliableWebSocket` service

```typescript
import { realtimeService } from '@/services/realtime/ReliableWebSocket';

// Unified interface with proper backoff/jitter
await realtimeService.connect();
```

### 6. Design System Consolidation

**Before**: Custom CSS classes and Tailwind config with duplication
**After**: Game-specific colors and animations moved to Tailwind config

```typescript
// New Tailwind classes available
className="text-game-text-primary bg-game-bg-primary animate-epic-card-drop"
```

## Breaking Changes

### GamePlay Component Props

If you have custom components that render `GamePlay`, update the props:

```typescript
// New required props for orchestration state
<GamePlay
  // ... existing props
  isProcessingMove={boolean}
  isPlaying={boolean} 
  onPlayPause={() => Promise<void>}
  mysteryCardRevealed={boolean}
  cardPlacementResult={object | null}
  gameEnded={boolean}
/>
```

### GameService Method Signatures

All GameService methods now validate inputs:

```typescript
// Will throw zod validation errors for invalid inputs
await GameService.placeCard(roomId, playerId, song, position);
// Ensure roomId and playerId are valid UUIDs
// Ensure song object has required fields
```

## Development Improvements

### TypeScript Strict Mode

- Enabled `strict: true`, `noImplicitAny`, `strictNullChecks`
- Fixed type issues throughout codebase

### Linting and Formatting

- Added Prettier configuration (`.prettierrc`)
- Enhanced ESLint rules to catch `any` types and unused variables

### CI/CD Pipeline

- Added GitHub Actions workflow (`.github/workflows/ci.yml`)
- Runs type-check, lint, and build on PRs

### Repository Hygiene

- Removed duplicate lockfiles (kept `package-lock.json`, removed `bun.lockb`)
- Updated `.gitignore` with comprehensive exclusions
- Added Node.js version specification in `package.json`

## Migration Checklist

- [ ] Update any custom GamePlay component usage to include new props
- [ ] Replace string literals with GamePhase constants
- [ ] Update any direct GameService calls to handle validation errors
- [ ] Replace old join form components with unified JoinForm
- [ ] Test game flow: menu → lobby → playing → finished
- [ ] Verify audio controls work in game
- [ ] Test validation error handling in join forms

## File Structure Changes

### New Files
- `src/schemas/validation.ts` - Zod validation schemas
- `src/services/IGameService.ts` - GameService interface
- `src/services/realtime/ReliableWebSocket.ts` - Unified realtime client
- `src/components/JoinForm.tsx` - Unified join form component
- `.prettierrc` - Code formatting config
- `.github/workflows/ci.yml` - CI/CD pipeline

### Modified Files  
- `src/types/game.ts` - Added GamePhase constants and helpers
- `src/components/Game.tsx` - Now central orchestrator
- `src/components/GamePlay.tsx` - Reduced to presentational component
- `tailwind.config.ts` - Added game-specific colors and animations
- `src/styles/design-system.css` - Reduced to essential mobile utilities
- `tsconfig.app.json` - Enabled strict mode
- `eslint.config.js` - Enhanced rules

### Removed Files
- `bun.lockb` (duplicate lockfile)

For questions or issues with migration, refer to the type definitions in `src/types/game.ts` and interface in `src/services/IGameService.ts`.