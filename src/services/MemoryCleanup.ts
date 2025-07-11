import { performanceMonitor } from './PerformanceMonitor';

interface CleanupTask {
  id: string;
  cleanup: () => void;
  priority: number; // Higher number = higher priority
}

class MemoryCleanupService {
  private cleanupTasks = new Map<string, CleanupTask>();
  private intervalId: NodeJS.Timeout | null = null;
  private isMonitoring = false;
  
  private readonly MEMORY_THRESHOLD = 80 * 1024 * 1024; // 80MB
  private readonly CHECK_INTERVAL = 30000; // 30 seconds

  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.intervalId = setInterval(() => {
      this.checkMemoryUsage();
    }, this.CHECK_INTERVAL);
    
    console.log('🧹 MemoryCleanup: Started monitoring');
  }

  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isMonitoring = false;
    console.log('🧹 MemoryCleanup: Stopped monitoring');
  }

  registerCleanupTask(id: string, cleanup: () => void, priority: number = 1): void {
    this.cleanupTasks.set(id, { id, cleanup, priority });
    console.log(`🧹 MemoryCleanup: Registered cleanup task "${id}" with priority ${priority}`);
  }

  unregisterCleanupTask(id: string): void {
    this.cleanupTasks.delete(id);
    console.log(`🧹 MemoryCleanup: Unregistered cleanup task "${id}"`);
  }

  private checkMemoryUsage(): void {
    const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
    
    if (memoryUsage > this.MEMORY_THRESHOLD) {
      console.warn(`🚨 Memory usage high: ${(memoryUsage / 1024 / 1024).toFixed(2)}MB`);
      this.performCleanup();
    }
    
    performanceMonitor.recordMetric('memoryUsage', memoryUsage);
  }

  performCleanup(force: boolean = false): void {
    const memoryBefore = performanceMonitor.getCurrentMemoryUsage();
    
    console.log(`🧹 MemoryCleanup: Starting cleanup (forced: ${force})`);
    
    // Sort tasks by priority (highest first)
    const sortedTasks = Array.from(this.cleanupTasks.values())
      .sort((a, b) => b.priority - a.priority);
    
    let tasksExecuted = 0;
    
    for (const task of sortedTasks) {
      try {
        task.cleanup();
        tasksExecuted++;
        console.log(`✅ MemoryCleanup: Executed task "${task.id}"`);
        
        // Check if memory is now under threshold (unless forced)
        if (!force) {
          const currentMemory = performanceMonitor.getCurrentMemoryUsage();
          if (currentMemory < this.MEMORY_THRESHOLD) {
            break;
          }
        }
      } catch (error) {
        console.error(`❌ MemoryCleanup: Failed to execute task "${task.id}":`, error);
      }
    }
    
    // Force garbage collection if available
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
    
    const memoryAfter = performanceMonitor.getCurrentMemoryUsage();
    const memoryFreed = memoryBefore - memoryAfter;
    
    console.log(`🧹 MemoryCleanup: Completed. Tasks executed: ${tasksExecuted}, Memory freed: ${(memoryFreed / 1024 / 1024).toFixed(2)}MB`);
  }

  // Specific cleanup methods for common patterns
  cleanupAudioElements(): void {
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      if (audio.paused && !audio.src.includes('blob:')) {
        audio.src = '';
        audio.load();
      }
    });
    console.log(`🧹 MemoryCleanup: Cleaned up ${audioElements.length} audio elements`);
  }

  cleanupEventListeners(): void {
    // This would need to be implemented based on specific event listener patterns
    // For now, just log that it was called
    console.log('🧹 MemoryCleanup: Event listener cleanup (placeholder)');
  }

  cleanupImageCache(): void {
    // Clear any cached images that aren't currently visible
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.offsetParent) { // Not visible
        img.src = '';
      }
    });
    console.log('🧹 MemoryCleanup: Image cache cleanup completed');
  }

  getCleanupReport(): {
    registeredTasks: number;
    currentMemory: number;
    threshold: number;
    isMonitoring: boolean;
  } {
    return {
      registeredTasks: this.cleanupTasks.size,
      currentMemory: performanceMonitor.getCurrentMemoryUsage(),
      threshold: this.MEMORY_THRESHOLD,
      isMonitoring: this.isMonitoring,
    };
  }
}

export const memoryCleanup = new MemoryCleanupService();

// Auto-register common cleanup tasks
memoryCleanup.registerCleanupTask('audio', () => memoryCleanup.cleanupAudioElements(), 3);
memoryCleanup.registerCleanupTask('images', () => memoryCleanup.cleanupImageCache(), 2);
memoryCleanup.registerCleanupTask('events', () => memoryCleanup.cleanupEventListeners(), 1);