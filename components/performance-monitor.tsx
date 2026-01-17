'use client';

import { useEffect } from 'react';
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';
import { logMetric, sendToAnalytics } from '@/lib/performance/web-vitals';

interface PerformanceMonitorProps {
  enableAnalytics?: boolean;
}

export function PerformanceMonitor({ enableAnalytics = false }: PerformanceMonitorProps) {
  useEffect(() => {
    // Always log in development
    onCLS(logMetric);
    onFCP(logMetric);
    onINP(logMetric);
    onLCP(logMetric);
    onTTFB(logMetric);

    // Optionally send to analytics endpoint
    if (enableAnalytics) {
      onCLS(sendToAnalytics);
      onFCP(sendToAnalytics);
      onINP(sendToAnalytics);
      onLCP(sendToAnalytics);
      onTTFB(sendToAnalytics);
    }
  }, [enableAnalytics]);

  // This component renders nothing
  return null;
}
