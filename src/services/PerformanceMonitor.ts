interface PerformanceMetrics {
  renderTime: number;
  networkLatency: number;
  errorRate: number;
  memoryUsage: number;
  audioLoadTime: number;
  timestamp: number;
}

interface PerformanceThresholds {
  maxRenderTime: number;
  maxNetworkLatency: number;
  maxErrorRate: number;
  maxMemoryUsage: number;
}

class PerformanceMonitorService {
  private metrics: PerformanceMetrics[] = [];
  private thresholds: PerformanceThresholds = {
    maxRenderTime: 16, // 60fps target
    maxNetworkLatency: 1000, // 1 second
    maxErrorRate: 0.05, // 5%
    maxMemoryUsage: 100 * 1024 * 1024, // 100MB
  };

  private warningCallbacks: ((metric: string, value: number) => void)[] = [];

  recordMetric(type: keyof PerformanceMetrics, value: number) {
    const metric: PerformanceMetrics = {
      renderTime: 0,
      networkLatency: 0,
      errorRate: 0,
      memoryUsage: 0,
      audioLoadTime: 0,
      timestamp: Date.now(),
      [type]: value,
    };

    this.metrics.push(metric);
    
    // Keep only last 100 metrics to prevent memory bloat
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    this.checkThresholds(type, value);
  }

  private checkThresholds(type: keyof PerformanceMetrics, value: number) {
    const thresholdKey = `max${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof PerformanceThresholds;
    const threshold = this.thresholds[thresholdKey];

    if (value > threshold) {
      console.warn(`🚨 Performance threshold exceeded: ${type} = ${value}, threshold = ${threshold}`);
      this.warningCallbacks.forEach(callback => callback(type, value));
    }
  }

  getAverageMetric(type: keyof PerformanceMetrics, timeWindow: number = 30000): number {
    const cutoff = Date.now() - timeWindow;
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff);
    
    if (recentMetrics.length === 0) return 0;
    
    const sum = recentMetrics.reduce((acc, metric) => acc + metric[type], 0);
    return sum / recentMetrics.length;
  }

  getCurrentMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  onPerformanceWarning(callback: (metric: string, value: number) => void) {
    this.warningCallbacks.push(callback);
  }

  getPerformanceReport(): {
    averageRenderTime: number;
    averageNetworkLatency: number;
    errorRate: number;
    memoryUsage: number;
    totalMetrics: number;
  } {
    const recentMetrics = this.metrics.slice(-50); // Last 50 metrics
    
    return {
      averageRenderTime: this.getAverageMetric('renderTime'),
      averageNetworkLatency: this.getAverageMetric('networkLatency'),
      errorRate: this.getAverageMetric('errorRate'),
      memoryUsage: this.getCurrentMemoryUsage(),
      totalMetrics: this.metrics.length,
    };
  }

  reset() {
    this.metrics = [];
  }
}

export const performanceMonitor = new PerformanceMonitorService();
