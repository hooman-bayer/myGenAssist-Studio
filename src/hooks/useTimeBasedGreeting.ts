import { useState, useEffect, useCallback } from 'react';
import {
  TimeOfDay,
  TimeGreetingConfig,
  getTimeGreetingConfig,
  prefersReducedMotion,
} from '@/lib/timeGreeting';

interface UseTimeBasedGreetingReturn {
  config: TimeGreetingConfig;
  period: TimeOfDay;
  reducedMotion: boolean;
  refresh: () => void;
}

/**
 * React hook for time-based greeting functionality
 * Automatically updates greeting when time period changes
 */
export function useTimeBasedGreeting(): UseTimeBasedGreetingReturn {
  const [config, setConfig] = useState<TimeGreetingConfig>(() => getTimeGreetingConfig());
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => prefersReducedMotion());

  const refresh = useCallback(() => {
    setConfig(getTimeGreetingConfig());
  }, []);

  useEffect(() => {
    // Update greeting config every minute to catch time period changes
    const interval = setInterval(() => {
      const newConfig = getTimeGreetingConfig();
      if (newConfig.period !== config.period) {
        setConfig(newConfig);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [config.period]);

  useEffect(() => {
    // Listen for reduced motion preference changes
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return {
    config,
    period: config.period,
    reducedMotion,
    refresh,
  };
}
