# Song Timeline Tunes - Game Flowchart

This document contains a comprehensive Mermaid flowchart diagram that visualizes the complete game flow, architecture, and system interactions for Song Timeline Tunes. The flowchart covers game initialization, UI setup, song data handling, gameplay mechanics, timer and progression systems, settings, educational content, multiplayer functionality, analytics, error handling, extensibility, API integration, and developer tools.

## Complete Game Architecture Flowchart

````mermaid
graph TB
    %% ===== GAME INITIALIZATION =====
    Start([Application Start]) --> Init{Initialize App}
    Init --> ViewportSetup[Initialize Viewport Height<br/>src/lib/viewport.ts]
    ViewportSetup --> ReactMount[Mount React App<br/>src/main.tsx]
    ReactMount --> AppProviders[Setup Providers<br/>React Query, Tooltip, Router<br/>src/App.tsx]
    
    AppProviders --> ErrorBoundaries[Initialize Error Boundaries<br/>src/components/ErrorBoundary.tsx<br/>src/components/GameErrorBoundary.tsx]
    ErrorBoundaries --> MainMenu[Load Main Menu<br/>src/components/MainMenu.tsx]
    
    %% ===== MAIN MENU & ROUTING =====
    MainMenu --> MenuChoice{User Choice}
    MenuChoice -->|Host Game| CreateRoom[Create Room<br/>src/hooks/useGameRoom.tsx]
    MenuChoice -->|Join Game| MobileJoin[Mobile Join Flow<br/>src/components/MobileJoinFlow.tsx]
    MenuChoice -->|Demo Mode| GameDemo[Game Mode Demo<br/>src/components/GamemodeDemo.tsx]
    
    %% ===== HOST FLOW =====
    CreateRoom --> SupabaseRoom[Create Room in Database<br/>src/services/gameService.ts]
    SupabaseRoom --> HostLobby[Host Lobby Interface<br/>src/components/HostLobby.tsx]
    
    HostLobby --> QRCode[Generate QR Code<br/>src/components/QRCodeGenerator.tsx]
    HostLobby --> PlayerMgmt[Player Management<br/>View/Kick Players]
    HostLobby --> GameSettings[Game Settings<br/>Mode: Classic/Fiend/Sprint<br/>Playlist Selection]
    HostLobby --> WaitPlayers[Wait for Players<br/>Real-time Updates]
    
    %% ===== PLAYER JOIN FLOW =====
    MobileJoin --> RoomCodeEntry[Room Code Entry<br/>src/components/MobileJoin.tsx]
    RoomCodeEntry --> ValidateRoom{Validate Room Code}
    ValidateRoom -->|Invalid| JoinError[Show Error Message]
    ValidateRoom -->|Valid| PlayerSetup[Player Name & Character<br/>src/components/MobilePlayerSetup.tsx]
    
    PlayerSetup --> JoinRoom[Join Room Database<br/>src/services/gameService.ts]
    JoinRoom --> MobileLobby[Mobile Player Lobby<br/>src/components/MobilePlayerLobby.tsx]
    
    %% ===== REAL-TIME SUBSCRIPTION SYSTEM =====
    SupabaseRoom --> RealtimeSetup[Setup Real-time Subscription<br/>src/hooks/useRealtimeSubscription.tsx]
    JoinRoom --> RealtimeSetup
    
    RealtimeSetup --> ConnectionMonitor[Connection Status Monitor<br/>src/components/ConnectionStatus.tsx]
    ConnectionMonitor --> NetworkCheck{Network Status}
    NetworkCheck -->|Disconnected| Reconnect[Auto Reconnection<br/>Exponential Backoff]
    NetworkCheck -->|Connected| SyncState[State Synchronization]
    
    Reconnect --> NetworkCheck
    SyncState --> RoomUpdates[Room State Updates]
    SyncState --> PlayerUpdates[Player List Updates]
    SyncState --> GameEvents[Game Event Broadcasting]
    
    %% ===== GAME INITIALIZATION =====
    WaitPlayers --> HostStart{Host Starts Game}
    MobileLobby --> WaitStart[Wait for Host Start]
    
    HostStart -->|Start| GameInit[Initialize Game Logic<br/>src/hooks/useGameLogic.tsx]
    WaitStart --> GameInit
    
    GameInit --> ModeSelection{Select Game Mode}
    ModeSelection -->|Classic| ClassicLogic[Classic Game Logic<br/>src/hooks/useClassicGameLogic.tsx]
    ModeSelection -->|Fiend| FiendLogic[Fiend Game Logic<br/>src/hooks/useFiendGameLogic.tsx]
    ModeSelection -->|Sprint| SprintLogic[Sprint Game Logic<br/>src/hooks/useSprintGameLogic.tsx]
    
    %% ===== PLAYLIST & SONG MANAGEMENT =====
    ClassicLogic --> PlaylistLoad[Load Default Playlist<br/>src/services/defaultPlaylistService.ts]
    FiendLogic --> PlaylistLoad
    SprintLogic --> PlaylistLoad
    
    PlaylistLoad --> SongValidation[Validate Song Data<br/>Check Preview URLs<br/>Filter Invalid Songs]
    SongValidation --> SongCache[Cache Song Metadata<br/>Background Loading]
    SongCache --> StartingCards[Assign Starting Cards<br/>src/services/gameService.ts]
    
    %% ===== AUDIO SYSTEM SETUP =====
    StartingCards --> AudioInit[Initialize Audio System<br/>src/hooks/useSoundEffects.tsx]
    AudioInit --> SoundLibrary[Load Sound Effects<br/>public/sounds/]
    SoundLibrary --> AudioContext[Setup Audio Context<br/>src/lib/SoundEffects.ts]
    AudioContext --> DeezerSetup[Setup Deezer Audio<br/>src/services/DeezerAudioService.ts]
    
    %% ===== GAME PLAY INITIALIZATION =====
    DeezerSetup --> GamePlayStart[Start Game Play<br/>src/components/GamePlay.tsx]
    GamePlayStart --> ViewSplit{Determine View Type}
    
    ViewSplit -->|Host| HostVisuals[Host Visuals<br/>src/components/HostVisuals.tsx]
    ViewSplit -->|Player| MobileGameView[Mobile Player Game View<br/>src/components/player/MobilePlayerGameView.tsx]
    
    %% ===== HOST GAME INTERFACE =====
    HostVisuals --> RecordPlayer[Record Player Display<br/>src/components/RecordMysteryCard.tsx<br/>Spinning Animation]
    HostVisuals --> PlayerCassettes[Cassette Player Display<br/>src/components/CassettePlayerDisplay.tsx<br/>Player Timelines]
    HostVisuals --> HostHeader[Host Game Header<br/>src/components/host/HostHeader.tsx<br/>Score & Timer]
    HostVisuals --> AllPlayersView[All Players Overview<br/>src/components/host/HostAllPlayersOverview.tsx]
    
    %% ===== MOBILE PLAYER INTERFACE =====
    MobileGameView --> PlayerTimeline[Personal Timeline<br/>Card Management Interface]
    MobileGameView --> MysteryCardMobile[Mystery Card Mobile<br/>src/components/MysteryCard.tsx<br/>Audio Controls]
    MobileGameView --> PlacementInterface[Card Placement Interface<br/>Drag & Drop System]
    
    %% ===== GAME TURN SYSTEM =====
    RecordPlayer --> TurnManager[Turn Management System]
    PlayerTimeline --> TurnManager
    
    TurnManager --> CurrentTurn{Current Player Turn}
    CurrentTurn --> SongSelection[Select Mystery Song<br/>From Available Pool]
    SongSelection --> SongBroadcast[Broadcast Song to All Players<br/>src/hooks/useGameRoom.tsx]
    
    SongBroadcast --> AudioPlayback[Audio Playback Control<br/>Preview & Full Track]
    AudioPlayback --> TimerStart[Start Turn Timer<br/>30 Second Default]
    
    %% ===== TIMER & PROGRESSION SYSTEM =====
    TimerStart --> TimerTick[Timer Countdown]
    TimerTick --> TimerCheck{Timer Status}
    TimerCheck -->|Time Left| WaitPlacement[Wait for Card Placement]
    TimerCheck -->|Time Up| ForceNext[Force Next Turn]
    
    WaitPlacement --> PlacementAction{Player Places Card}
    PlacementAction -->|Placed| ValidatePlacement[Validate Card Placement<br/>Check Chronological Order]
    PlacementAction -->|No Action| TimerTick
    
    %% ===== CARD PLACEMENT SYSTEM =====
    ValidatePlacement --> PlacementResult{Placement Correct?}
    PlacementResult -->|Correct| CorrectPlacement[Correct Placement<br/>Update Score<br/>Play Success Sound]
    PlacementResult -->|Incorrect| IncorrectPlacement[Incorrect Placement<br/>Show Correct Position<br/>Play Error Sound]
    
    CorrectPlacement --> UpdateTimeline[Update Player Timeline<br/>Add Song to Timeline]
    IncorrectPlacement --> UpdateTimeline
    UpdateTimeline --> SyncTimeline[Sync Timeline to Database<br/>Broadcast to All Players]
    
    %% ===== GAME PROGRESSION =====
    SyncTimeline --> CheckWinCondition{Check Win Condition}
    CheckWinCondition -->|Classic: 10 Songs| PlayerWins[Player Wins]
    CheckWinCondition -->|Fiend: Round Limit| FiendCheck[Check Fiend Mode Rules]
    CheckWinCondition -->|Sprint: Target Cards| SprintCheck[Check Sprint Mode Rules]
    CheckWinCondition -->|Continue| NextTurn[Next Turn Transition]
    
    FiendCheck --> FiendWin{Fiend Win Condition}
    SprintCheck --> SprintWin{Sprint Win Condition}
    FiendWin -->|Win| PlayerWins
    FiendWin -->|Continue| NextTurn
    SprintWin -->|Win| PlayerWins
    SprintWin -->|Continue| NextTurn
    
    %% ===== TURN TRANSITIONS =====
    NextTurn --> TurnTransition[Turn Transition Animation<br/>src/lib/animations.ts]
    ForceNext --> TurnTransition
    
    TurnTransition --> NextPlayer[Select Next Player<br/>Round Robin System]
    NextPlayer --> TurnManager
    
    %% ===== VICTORY SYSTEM =====
    PlayerWins --> VictoryScreen[Victory Screen<br/>src/components/VictoryScreen.tsx]
    VictoryScreen --> Confetti[Confetti Animation<br/>Winner Celebration]
    VictoryScreen --> FinalScores[Display Final Scores<br/>Leaderboard]
    VictoryScreen --> PlayAgain{Play Again Option}
    
    PlayAgain -->|Yes| ResetGame[Reset Game State<br/>Keep Room & Players]
    PlayAgain -->|No| EndGame[End Game<br/>Return to Menu]
    
    ResetGame --> GameInit
    EndGame --> MainMenu
    
    %% ===== SETTINGS & CONFIGURATION =====
    GameSettings --> ModeConfig[Game Mode Configuration]
    ModeConfig --> ClassicSettings[Classic: Standard Rules<br/>10 Songs to Win]
    ModeConfig --> FiendSettings[Fiend: Advanced Mode<br/>Configurable Rounds]
    ModeConfig --> SprintSettings[Sprint: Fast-Paced<br/>Target Card Count]
    
    GameSettings --> AudioSettings[Audio Settings<br/>Volume Control<br/>Mute/Unmute]
    AudioSettings --> SoundToggle[Sound Effects Toggle]
    AudioSettings --> MusicToggle[Background Music Toggle]
    
    GameSettings --> PlaylistSettings[Playlist Configuration<br/>Custom Song Lists<br/>Difficulty Levels]
    
    %% ===== TUTORIAL & ONBOARDING =====
    MainMenu --> Tutorial{First Time User?}
    Tutorial -->|Yes| TutorialFlow[Tutorial Flow<br/>Game Rules Explanation<br/>Interface Walkthrough]
    Tutorial -->|No| MenuChoice
    
    TutorialFlow --> PracticeMode[Practice Mode<br/>Single Player Tutorial]
    PracticeMode --> TutorialComplete[Tutorial Complete]
    TutorialComplete --> MainMenu
    
    %% ===== THEME & VISUAL SYSTEM =====
    AppProviders --> ThemeProvider[Theme Provider<br/>Dark/Light Mode<br/>src/styles/design-system.css]
    ThemeProvider --> VisualConfig[Visual Configuration<br/>Colors, Fonts, Animations]
    
    VisualConfig --> ResponsiveDesign[Responsive Design System<br/>Mobile-First Approach<br/>Tailwind CSS]
    ResponsiveDesign --> ComponentLibrary[Component Library<br/>shadcn/ui Components<br/>src/components/ui/]
    
    %% ===== EDUCATIONAL CONTENT =====
    SongSelection --> SongInfo[Song Information Display<br/>Artist, Album, Year<br/>Historical Context]
    SongInfo --> EducationalMode{Educational Mode?}
    EducationalMode -->|Yes| MusicHistory[Music History Facts<br/>Genre Information<br/>Cultural Context]
    EducationalMode -->|No| AudioPlayback
    
    MusicHistory --> QuizMode[Quiz Mode Integration<br/>Additional Questions<br/>Learning Objectives]
    QuizMode --> AudioPlayback
    
    %% ===== MULTIPLAYER EXTENSIONS =====
    RealtimeSetup --> MultiplayerFeatures[Advanced Multiplayer Features]
    MultiplayerFeatures --> TeamMode[Team Mode Support<br/>Collaborative Timelines]
    MultiplayerFeatures --> TournamentMode[Tournament Mode<br/>Bracket System]
    MultiplayerFeatures --> SpectatorMode[Spectator Mode<br/>View-Only Access]
    
    TeamMode --> TeamLogic[Team-Based Game Logic<br/>Shared Scoring System]
    TournamentMode --> BracketSystem[Tournament Bracket<br/>Elimination System]
    SpectatorMode --> ViewOnlyInterface[Spectator Interface<br/>Live Game Viewing]
    
    %% ===== ANALYTICS & TRACKING =====
    GameEvents --> AnalyticsCapture[Analytics Event Capture<br/>Player Actions<br/>Game Metrics]
    AnalyticsCapture --> DataCollection[Data Collection System<br/>Performance Metrics<br/>User Behavior]
    
    DataCollection --> AnalyticsDashboard[Analytics Dashboard<br/>Game Statistics<br/>Player Progress]
    AnalyticsDashboard --> Insights[Game Insights<br/>Difficulty Analysis<br/>Engagement Metrics]
    
    %% ===== ERROR HANDLING SYSTEM =====
    NetworkCheck --> ErrorHandler[Error Handling System<br/>src/components/ErrorBoundary.tsx]
    ErrorHandler --> ErrorTypes{Error Type Classification}
    
    ErrorTypes -->|Network| NetworkError[Network Error Recovery<br/>Retry Logic<br/>Offline Mode]
    ErrorTypes -->|Game Logic| GameError[Game Logic Error<br/>State Recovery<br/>User Notification]
    ErrorTypes -->|Audio| AudioError[Audio Error Handling<br/>Fallback Options<br/>Silent Mode]
    ErrorTypes -->|Database| DatabaseError[Database Error Recovery<br/>Local Caching<br/>Sync on Recovery]
    
    NetworkError --> ErrorRecovery[Error Recovery Procedures]
    GameError --> ErrorRecovery
    AudioError --> ErrorRecovery
    DatabaseError --> ErrorRecovery
    
    ErrorRecovery --> ErrorLogging[Error Logging & Reporting<br/>Development Feedback]
    ErrorLogging --> UserFeedback[User Feedback System<br/>Error Notifications<br/>Recovery Instructions]
    
    %% ===== EXTENSIBILITY SYSTEM =====
    PlaylistLoad --> PluginSystem[Plugin System Architecture<br/>Custom Song Sources<br/>Extended Game Modes]
    PluginSystem --> APIExtensions[API Extensions<br/>Third-Party Integrations<br/>Custom Playlists]
    
    APIExtensions --> SpotifyIntegration[Spotify Integration<br/>Personal Playlists<br/>Recommendations]
    APIExtensions --> YouTubeIntegration[YouTube Integration<br/>Music Video Support<br/>Extended Catalog]
    APIExtensions --> CustomSources[Custom Music Sources<br/>Local File Support<br/>Streaming Services]
    
    %% ===== API INTEGRATION LAYER =====
    DeezerSetup --> APIManager[API Management Layer<br/>Rate Limiting<br/>Authentication]
    APIManager --> DeezerAPI[Deezer API Integration<br/>Music Catalog<br/>Preview Tracks]
    APIManager --> DatabaseAPI[Supabase API<br/>Real-time Database<br/>Authentication]
    
    DeezerAPI --> MusicCatalog[Music Catalog Management<br/>Song Search<br/>Metadata Enrichment]
    DatabaseAPI --> DataSync[Data Synchronization<br/>Real-time Updates<br/>Conflict Resolution]
    
    %% ===== DEVELOPER TOOLS =====
    ErrorLogging --> DevTools[Developer Tools Integration<br/>Debug Interface<br/>Performance Monitoring]
    DevTools --> DebugConsole[Debug Console<br/>Game State Inspection<br/>Event Logging]
    DevTools --> PerformanceProfiler[Performance Profiler<br/>Render Analysis<br/>Memory Usage]
    
    DebugConsole --> StateInspector[State Inspector<br/>Real-time State Viewing<br/>Action Replay]
    PerformanceProfiler --> OptimizationSuggestions[Optimization Suggestions<br/>Performance Alerts<br/>Best Practices]
    
    %% ===== TESTING & QUALITY ASSURANCE =====
    DevTools --> TestingSuite[Testing Suite Integration<br/>Unit Tests<br/>Integration Tests]
    TestingSuite --> AutomatedTesting[Automated Testing<br/>E2E Test Scenarios<br/>Regression Testing]
    TestingSuite --> ManualTesting[Manual Testing Tools<br/>Game State Manipulation<br/>Scenario Simulation]
    
    AutomatedTesting --> TestReports[Test Reports<br/>Coverage Analysis<br/>Quality Metrics]
    ManualTesting --> TestReports
    
    %% ===== DEPLOYMENT & MONITORING =====
    TestReports --> DeploymentPipeline[Deployment Pipeline<br/>Build Process<br/>Environment Management]
    DeploymentPipeline --> ProductionDeploy[Production Deployment<br/>CDN Integration<br/>Performance Optimization]
    
    ProductionDeploy --> MonitoringSystem[Monitoring System<br/>Uptime Tracking<br/>Error Monitoring]
    MonitoringSystem --> AlertSystem[Alert System<br/>Performance Alerts<br/>Error Notifications]
    
    AlertSystem --> MaintenanceMode[Maintenance Mode<br/>Graceful Shutdowns<br/>Update Notifications]
    
    %% ===== STYLING =====
    classDef initClass fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef menuClass fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef hostClass fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef playerClass fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef gameClass fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    classDef audioClass fill:#f1f8e9,stroke:#33691e,stroke-width:2px
    classDef errorClass fill:#ffebee,stroke:#b71c1c,stroke-width:2px
    classDef apiClass fill:#e0f2f1,stroke:#00695c,stroke-width:2px
    classDef devClass fill:#f9fbe7,stroke:#827717,stroke-width:2px
    
    class Start,Init,ViewportSetup,ReactMount,AppProviders,ErrorBoundaries initClass
    class MainMenu,MenuChoice,GameDemo menuClass
    class CreateRoom,SupabaseRoom,HostLobby,QRCode,PlayerMgmt,GameSettings,WaitPlayers,HostVisuals,RecordPlayer,PlayerCassettes,HostHeader,AllPlayersView hostClass
    class MobileJoin,RoomCodeEntry,ValidateRoom,PlayerSetup,JoinRoom,MobileLobby,MobileGameView,PlayerTimeline,MysteryCardMobile,PlacementInterface playerClass
    class GameInit,ModeSelection,ClassicLogic,FiendLogic,SprintLogic,GamePlayStart,TurnManager,CurrentTurn,SongSelection,SongBroadcast,TimerStart,TimerTick,TimerCheck,WaitPlacement,PlacementAction,ValidatePlacement,PlacementResult,CorrectPlacement,IncorrectPlacement,UpdateTimeline,SyncTimeline,CheckWinCondition,PlayerWins,VictoryScreen,Confetti,FinalScores,PlayAgain,ResetGame,EndGame gameClass
    class AudioInit,SoundLibrary,AudioContext,DeezerSetup,AudioPlayback,AudioSettings,SoundToggle,MusicToggle audioClass
    class ErrorHandler,ErrorTypes,NetworkError,GameError,AudioError,DatabaseError,ErrorRecovery,ErrorLogging,UserFeedback errorClass
    class APIManager,DeezerAPI,DatabaseAPI,MusicCatalog,DataSync,APIExtensions,SpotifyIntegration,YouTubeIntegration,CustomSources apiClass
    class DevTools,DebugConsole,PerformanceProfiler,StateInspector,OptimizationSuggestions,TestingSuite,AutomatedTesting,ManualTesting,TestReports,DeploymentPipeline,ProductionDeploy,MonitoringSystem,AlertSystem,MaintenanceMode devClass
````

## Flowchart Component Legend

### Color Coding
- **Light Blue**: Initialization and setup components
- **Purple**: Main menu and navigation systems
- **Green**: Host-specific functionality and interfaces
- **Orange**: Player-specific mobile interfaces and interactions
- **Pink**: Core gameplay mechanics and turn management
- **Light Green**: Audio and sound systems
- **Red**: Error handling and recovery systems
- **Teal**: API integration and external services
- **Yellow**: Developer tools and testing infrastructure

### Key System Integrations

#### Real-time Multiplayer Flow
The flowchart shows how real-time synchronization works through:
1. Supabase real-time subscriptions
2. Connection monitoring and automatic reconnection
3. State synchronization across all connected clients
4. Event broadcasting for game actions

#### Game Mode Variations
Three distinct game modes are supported:
- **Classic Mode**: Traditional turn-based gameplay (10 songs to win)
- **Fiend Mode**: Advanced mode with configurable rules and rounds
- **Sprint Mode**: Fast-paced gameplay with target card counts

#### Audio System Architecture
Comprehensive audio handling including:
- Background music and sound effects management
- Deezer API integration for music previews
- Audio context management for browser compatibility
- Volume controls and mute functionality

#### Error Handling Strategy
Multi-layered error recovery system:
- Component-level error boundaries
- Network connectivity monitoring
- Automatic retry logic with exponential backoff
- Graceful degradation for offline scenarios

#### Extensibility Framework
Plugin architecture supporting:
- Third-party music service integrations
- Custom playlist sources
- Extended game modes
- Developer tool integrations

This comprehensive flowchart serves as a visual guide for understanding the complete system architecture and can be rendered in any Mermaid-compatible editor for interactive exploration.