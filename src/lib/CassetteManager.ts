/**
 * Cassette Asset Manager
 * Manages cassette/music player assets for the host view
 */

export interface CassetteAsset {
  id: string;
  name: string;
  imagePath: string;
  displayName: string;
  theme: 'classic' | 'modern' | 'retro';
}

export const CASSETTE_ASSETS: CassetteAsset[] = [
  {
    id: 'vinyl_classic',
    name: 'classic_vinyl',
    imagePath: '/Vinyl_rythm.png',
    displayName: 'Classic Vinyl',
    theme: 'classic'
  },
  {
    id: 'vinyl_modern',
    name: 'modern_vinyl', 
    imagePath: '/Vinyl2_rythm.png',
    displayName: 'Modern Vinyl',
    theme: 'modern'
  }
];

class CassetteManager {
  private static instance: CassetteManager;
  private currentCassette: CassetteAsset | null = null;
  private sessionCassettes: Map<string, CassetteAsset> = new Map();

  private constructor() {
    // Start with a random cassette
    this.selectRandomCassette();
  }

  static getInstance(): CassetteManager {
    if (!CassetteManager.instance) {
      CassetteManager.instance = new CassetteManager();
    }
    return CassetteManager.instance;
  }

  /**
   * Get all available cassette assets
   */
  getAvailableCassettes(): CassetteAsset[] {
    return CASSETTE_ASSETS;
  }

  /**
   * Get currently selected cassette
   */
  getCurrentCassette(): CassetteAsset | null {
    return this.currentCassette;
  }

  /**
   * Select a specific cassette by ID
   */
  selectCassette(cassetteId: string): CassetteAsset | null {
    const cassette = CASSETTE_ASSETS.find(c => c.id === cassetteId);
    if (cassette) {
      this.currentCassette = cassette;
      return cassette;
    }
    return null;
  }

  /**
   * Select a random cassette
   */
  selectRandomCassette(): CassetteAsset {
    const randomIndex = Math.floor(Math.random() * CASSETTE_ASSETS.length);
    const cassette = CASSETTE_ASSETS[randomIndex];
    this.currentCassette = cassette;
    return cassette;
  }

  /**
   * Get cassette by ID
   */
  getCassetteById(cassetteId: string): CassetteAsset | null {
    return CASSETTE_ASSETS.find(c => c.id === cassetteId) || null;
  }

  /**
   * Set cassette for a specific session/room
   */
  setSessionCassette(sessionId: string, cassette: CassetteAsset): void {
    this.sessionCassettes.set(sessionId, cassette);
  }

  /**
   * Get cassette for a specific session/room
   */
  getSessionCassette(sessionId: string): CassetteAsset | null {
    return this.sessionCassettes.get(sessionId) || null;
  }

  /**
   * Get cassette image path
   */
  getCassetteImagePath(cassetteId: string): string {
    const cassette = this.getCassetteById(cassetteId);
    return cassette?.imagePath || '/Vinyl_rythm.png'; // Default fallback
  }

  /**
   * Clear session data
   */
  clearSession(): void {
    this.sessionCassettes.clear();
  }

  /**
   * Get cassette for theme
   */
  getCassetteByTheme(theme: 'classic' | 'modern' | 'retro'): CassetteAsset | null {
    return CASSETTE_ASSETS.find(c => c.theme === theme) || null;
  }
}

// Singleton instance
export const cassetteManager = CassetteManager.getInstance();

// React hook for cassette selection
export const useCassetteSelection = () => {
  const [currentCassette, setCurrentCassette] = React.useState<CassetteAsset | null>(
    cassetteManager.getCurrentCassette()
  );

  const selectCassette = (cassetteId: string) => {
    const cassette = cassetteManager.selectCassette(cassetteId);
    setCurrentCassette(cassette);
    return cassette;
  };

  const selectRandomCassette = () => {
    const cassette = cassetteManager.selectRandomCassette();
    setCurrentCassette(cassette);
    return cassette;
  };

  const getAvailableCassettes = () => cassetteManager.getAvailableCassettes();

  return {
    currentCassette,
    selectCassette,
    selectRandomCassette,
    getAvailableCassettes,
    getCassetteById: cassetteManager.getCassetteById.bind(cassetteManager),
    getCassetteImagePath: cassetteManager.getCassetteImagePath.bind(cassetteManager),
  };
};

// Import React for the hook
import React from 'react';