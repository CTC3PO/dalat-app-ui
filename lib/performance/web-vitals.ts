import type { Metric } from 'web-vitals';

export type WebVitalsMetric = Metric;

export interface PerformanceReport {
  metric: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  navigationType: string;
  url: string;
  timestamp: number;
}

// Thresholds based on Google's Core Web Vitals guidelines
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },      // Largest Contentful Paint
  FID: { good: 100, poor: 300 },         // First Input Delay (legacy)
  INP: { good: 200, poor: 500 },         // Interaction to Next Paint
  CLS: { good: 0.1, poor: 0.25 },        // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 },       // First Contentful Paint
  TTFB: { good: 800, poor: 1800 },       // Time to First Byte
};

export function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

export function formatMetricValue(name: string, value: number): string {
  if (name === 'CLS') {
    return value.toFixed(3);
  }
  return `${Math.round(value)}ms`;
}

export function createPerformanceReport(metric: Metric): PerformanceReport {
  return {
    metric: metric.name,
    value: metric.value,
    rating: getRating(metric.name, metric.value),
    navigationType: metric.navigationType || 'unknown',
    url: typeof window !== 'undefined' ? window.location.href : '',
    timestamp: Date.now(),
  };
}

// Log to console in development with color-coded ratings
export function logMetric(metric: Metric): void {
  if (process.env.NODE_ENV !== 'development') return;

  const report = createPerformanceReport(metric);
  const colors = {
    good: 'color: #0cce6b',
    'needs-improvement': 'color: #ffa400',
    poor: 'color: #ff4e42',
  };

  console.log(
    `%c[Web Vitals] ${report.metric}: ${formatMetricValue(report.metric, report.value)} (${report.rating})`,
    colors[report.rating]
  );
}

// Send metric to analytics endpoint (optional)
export async function sendToAnalytics(metric: Metric): Promise<void> {
  const report = createPerformanceReport(metric);

  // Use sendBeacon for reliability during page unload
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify(report)], { type: 'application/json' });
    navigator.sendBeacon('/api/performance', blob);
  }
}
