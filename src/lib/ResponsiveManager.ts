/**
 * Responsive Design Utilities
 * Handles viewport calculations, safe areas, and responsive behavior
 */

export interface ViewportInfo {
  width: number;
  height: number;
  safeHeight: number;
  isPortrait: boolean;
  isLandscape: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  devicePixelRatio: number;
}

export interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

class ResponsiveManager {
  private static instance: ResponsiveManager;
  private viewportInfo: ViewportInfo;
  private safeAreaInsets: SafeAreaInsets;
  private observers: Set<(info: ViewportInfo) => void> = new Set();

  private constructor() {
    this.viewportInfo = this.calculateViewportInfo();
    this.safeAreaInsets = this.calculateSafeAreaInsets();
    this.setupEventListeners();
  }

  static getInstance(): ResponsiveManager {
    if (!ResponsiveManager.instance) {
      ResponsiveManager.instance = new ResponsiveManager();
    }
    return ResponsiveManager.instance;
  }

  /**
   * Get current viewport information
   */
  getViewportInfo(): ViewportInfo {
    return { ...this.viewportInfo };
  }

  /**
   * Get safe area insets
   */
  getSafeAreaInsets(): SafeAreaInsets {
    return { ...this.safeAreaInsets };
  }

  /**
   * Subscribe to viewport changes
   */
  subscribe(callback: (info: ViewportInfo) => void): () => void {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  /**
   * Calculate viewport information
   */
  private calculateViewportInfo(): ViewportInfo {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const safeHeight = this.calculateSafeHeight();
    
    return {
      width,
      height,
      safeHeight,
      isPortrait: height > width,
      isLandscape: width > height,
      isMobile: width < 768,
      isTablet: width >= 768 && width < 1024,
      isDesktop: width >= 1024,
      devicePixelRatio: window.devicePixelRatio || 1,
    };
  }

  /**
   * Calculate safe area insets
   */
  private calculateSafeAreaInsets(): SafeAreaInsets {
    const getEnvValue = (variable: string): number => {
      if (CSS && CSS.supports) {
        if (CSS.supports(`padding: env(${variable})`)) {
          const element = document.createElement('div');
          element.style.padding = `env(${variable})`;
          document.body.appendChild(element);
          const value = parseInt(getComputedStyle(element).paddingTop, 10) || 0;
          document.body.removeChild(element);
          return value;
        }
      }
      return 0;
    };

    return {
      top: getEnvValue('safe-area-inset-top'),
      bottom: getEnvValue('safe-area-inset-bottom'),
      left: getEnvValue('safe-area-inset-left'),
      right: getEnvValue('safe-area-inset-right'),
    };
  }

  /**
   * Calculate safe height (viewport height minus safe area insets)
   */
  private calculateSafeHeight(): number {
    const height = window.innerHeight;
    const insets = this.calculateSafeAreaInsets();
    return height - insets.top - insets.bottom;
  }

  /**
   * Setup event listeners for viewport changes
   */
  private setupEventListeners(): void {
    const updateViewport = () => {
      this.viewportInfo = this.calculateViewportInfo();
      this.safeAreaInsets = this.calculateSafeAreaInsets();
      this.notifyObservers();
    };

    // Debounce resize events
    let resizeTimeout: NodeJS.Timeout;
    const debouncedUpdate = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateViewport, 100);
    };

    window.addEventListener('resize', debouncedUpdate);
    window.addEventListener('orientationchange', () => {
      // Wait for orientation change to complete
      setTimeout(updateViewport, 100);
    });

    // Handle dynamic viewport height changes (mobile browser address bar)
    if ('visualViewport' in window) {
      window.visualViewport?.addEventListener('resize', debouncedUpdate);
    }
  }

  /**
   * Notify all observers of viewport changes
   */
  private notifyObservers(): void {
    this.observers.forEach(callback => callback(this.viewportInfo));
  }
}

/**
 * CSS Custom Properties Helper
 */
export const setCSSCustomProperties = (viewport: ViewportInfo, safeArea: SafeAreaInsets): void => {
  const root = document.documentElement;
  
  // Viewport properties
  root.style.setProperty('--viewport-width', `${viewport.width}px`);
  root.style.setProperty('--viewport-height', `${viewport.height}px`);
  root.style.setProperty('--viewport-safe-height', `${viewport.safeHeight}px`);
  
  // Safe area properties
  root.style.setProperty('--safe-area-inset-top', `${safeArea.top}px`);
  root.style.setProperty('--safe-area-inset-bottom', `${safeArea.bottom}px`);
  root.style.setProperty('--safe-area-inset-left', `${safeArea.left}px`);
  root.style.setProperty('--safe-area-inset-right', `${safeArea.right}px`);
  
  // Device properties
  root.style.setProperty('--device-pixel-ratio', `${viewport.devicePixelRatio}`);
  
  // Responsive utilities
  root.style.setProperty('--is-mobile', viewport.isMobile ? '1' : '0');
  root.style.setProperty('--is-tablet', viewport.isTablet ? '1' : '0');
  root.style.setProperty('--is-desktop', viewport.isDesktop ? '1' : '0');
};

/**
 * React hook for responsive design
 */
export const useResponsive = () => {
  const [viewportInfo, setViewportInfo] = React.useState<ViewportInfo>(() => 
    responsiveManager.getViewportInfo()
  );
  
  const [safeAreaInsets, setSafeAreaInsets] = React.useState<SafeAreaInsets>(() =>
    responsiveManager.getSafeAreaInsets()
  );

  React.useEffect(() => {
    const unsubscribe = responsiveManager.subscribe((info) => {
      setViewportInfo(info);
      setSafeAreaInsets(responsiveManager.getSafeAreaInsets());
      
      // Update CSS custom properties
      setCSSCustomProperties(info, responsiveManager.getSafeAreaInsets());
    });

    // Initial CSS custom properties setup
    setCSSCustomProperties(viewportInfo, safeAreaInsets);

    return unsubscribe;
  }, []);

  return {
    viewport: viewportInfo,
    safeArea: safeAreaInsets,
    isMobile: viewportInfo.isMobile,
    isTablet: viewportInfo.isTablet,
    isDesktop: viewportInfo.isDesktop,
    isPortrait: viewportInfo.isPortrait,
    isLandscape: viewportInfo.isLandscape,
  };
};

/**
 * Utility functions for responsive calculations
 */
export const getResponsiveValue = <T>(
  mobileValue: T,
  tabletValue: T,
  desktopValue: T,
  viewport: ViewportInfo
): T => {
  if (viewport.isMobile) return mobileValue;
  if (viewport.isTablet) return tabletValue;
  return desktopValue;
};

export const getScaledFontSize = (baseSize: number, viewport: ViewportInfo): number => {
  const scaleFactor = Math.min(viewport.width / 375, viewport.height / 667); // Based on iPhone 6/7/8
  return Math.max(baseSize * scaleFactor, baseSize * 0.8); // Minimum 80% of base size
};

export const getTouchFriendlySize = (baseSize: number): number => {
  return Math.max(baseSize, 44); // Minimum 44px for touch targets (Apple HIG)
};

/**
 * Generate responsive styles object
 */
export const createResponsiveStyles = (viewport: ViewportInfo) => ({
  container: {
    width: '100%',
    height: `${viewport.safeHeight}px`,
    paddingTop: `${viewport.isMobile ? 'env(safe-area-inset-top)' : '0px'}`,
    paddingBottom: `${viewport.isMobile ? 'env(safe-area-inset-bottom)' : '0px'}`,
    paddingLeft: `${viewport.isMobile ? 'env(safe-area-inset-left)' : '0px'}`,
    paddingRight: `${viewport.isMobile ? 'env(safe-area-inset-right)' : '0px'}`,
  },
  
  flexContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    overflow: 'hidden',
  },
  
  scrollContainer: {
    overflowX: 'hidden' as const,
    overflowY: 'auto' as const,
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'none' as const,
    msOverflowStyle: 'none' as const,
  },
  
  touchOptimized: {
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    WebkitTouchCallout: 'none',
    WebkitUserSelect: 'none',
    userSelect: 'none' as const,
  },
});

// Singleton instance
export const responsiveManager = ResponsiveManager.getInstance();

// Initialize CSS custom properties on load
if (typeof window !== 'undefined') {
  const viewport = responsiveManager.getViewportInfo();
  const safeArea = responsiveManager.getSafeAreaInsets();
  setCSSCustomProperties(viewport, safeArea);
}

// Import React for hooks
import React from 'react';