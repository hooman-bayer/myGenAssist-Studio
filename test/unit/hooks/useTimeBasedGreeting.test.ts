// ========= Copyright 2025-2026 @ Eigent.ai All Rights Reserved. =========
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// ========= Copyright 2025-2026 @ Eigent.ai All Rights Reserved. =========

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimeBasedGreeting } from '../../../src/hooks/useTimeBasedGreeting';
import * as timeGreetingModule from '@/lib/timeGreeting';

// Mock the timeGreeting module
vi.mock('@/lib/timeGreeting', async (importOriginal) => {
  const actual = await importOriginal<typeof timeGreetingModule>();
  return {
    ...actual,
    getTimeGreetingConfig: vi.fn(),
    prefersReducedMotion: vi.fn(),
  };
});

/**
 * Helper to create a mock MediaQueryList with event listener support
 */
function createMockMediaQueryList(matches: boolean = false): MediaQueryList {
  const listeners: Array<(e: MediaQueryListEvent) => void> = [];

  return {
    matches,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn((event: string, callback: (e: MediaQueryListEvent) => void) => {
      if (event === 'change') {
        listeners.push(callback);
      }
    }),
    removeEventListener: vi.fn((event: string, callback: (e: MediaQueryListEvent) => void) => {
      if (event === 'change') {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    }),
    dispatchEvent: vi.fn((event: MediaQueryListEvent) => {
      listeners.forEach((listener) => listener(event));
      return true;
    }),
    // Helper for tests to trigger change events
    _triggerChange: (newMatches: boolean) => {
      const event = { matches: newMatches } as MediaQueryListEvent;
      listeners.forEach((listener) => listener(event));
    },
    _getListenerCount: () => listeners.length,
  } as MediaQueryList & { _triggerChange: (matches: boolean) => void; _getListenerCount: () => number };
}

/**
 * Helper to create a mock TimeGreetingConfig
 */
function createMockConfig(period: timeGreetingModule.TimeOfDay): timeGreetingModule.TimeGreetingConfig {
  return {
    period,
    greetingKey: `layout.greeting-${period}`,
    taglineKey: `layout.tagline-${period}`,
    gradientColors: ['#8AD32A', '#FFD700', '#FFA500', '#8AD32A'],
  };
}

describe('useTimeBasedGreeting', () => {
  let mockMediaQueryList: ReturnType<typeof createMockMediaQueryList>;
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create fresh mock MediaQueryList for each test
    mockMediaQueryList = createMockMediaQueryList(false);

    // Mock window.matchMedia
    window.matchMedia = vi.fn().mockReturnValue(mockMediaQueryList);

    // Default mock implementations
    vi.mocked(timeGreetingModule.getTimeGreetingConfig).mockReturnValue(createMockConfig('morning'));
    vi.mocked(timeGreetingModule.prefersReducedMotion).mockReturnValue(false);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    window.matchMedia = originalMatchMedia;
  });

  describe('Initial state', () => {
    it('returns config with current period', () => {
      const mockConfig = createMockConfig('afternoon');
      vi.mocked(timeGreetingModule.getTimeGreetingConfig).mockReturnValue(mockConfig);

      const { result } = renderHook(() => useTimeBasedGreeting());

      expect(result.current.config).toEqual(mockConfig);
      expect(result.current.period).toBe('afternoon');
    });

    it('returns reducedMotion from prefersReducedMotion()', () => {
      vi.mocked(timeGreetingModule.prefersReducedMotion).mockReturnValue(true);

      const { result } = renderHook(() => useTimeBasedGreeting());

      expect(result.current.reducedMotion).toBe(true);
    });

    it('config structure matches getTimeGreetingConfig output', () => {
      const expectedConfig = createMockConfig('evening');
      vi.mocked(timeGreetingModule.getTimeGreetingConfig).mockReturnValue(expectedConfig);

      const { result } = renderHook(() => useTimeBasedGreeting());

      expect(result.current.config).toHaveProperty('period');
      expect(result.current.config).toHaveProperty('greetingKey');
      expect(result.current.config).toHaveProperty('taglineKey');
      expect(result.current.config).toHaveProperty('gradientColors');
      expect(result.current.config.period).toBe(expectedConfig.period);
      expect(result.current.config.greetingKey).toBe(expectedConfig.greetingKey);
      expect(result.current.config.taglineKey).toBe(expectedConfig.taglineKey);
      expect(result.current.config.gradientColors).toEqual(expectedConfig.gradientColors);
    });
  });

  describe('refresh() callback', () => {
    it('updates config when called', () => {
      const initialConfig = createMockConfig('morning');
      const updatedConfig = createMockConfig('afternoon');

      vi.mocked(timeGreetingModule.getTimeGreetingConfig)
        .mockReturnValueOnce(initialConfig)
        .mockReturnValue(updatedConfig);

      const { result } = renderHook(() => useTimeBasedGreeting());

      expect(result.current.config.period).toBe('morning');

      act(() => {
        result.current.refresh();
      });

      expect(result.current.config.period).toBe('afternoon');
      expect(timeGreetingModule.getTimeGreetingConfig).toHaveBeenCalledTimes(2);
    });

    it('callback is stable across re-renders (referential equality via useCallback)', () => {
      const { result, rerender } = renderHook(() => useTimeBasedGreeting());

      const firstRefresh = result.current.refresh;

      rerender();

      const secondRefresh = result.current.refresh;

      expect(firstRefresh).toBe(secondRefresh);
    });
  });

  describe('Period detection (interval)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('updates config when time period changes (simulate with fake timers)', () => {
      const morningConfig = createMockConfig('morning');
      const afternoonConfig = createMockConfig('afternoon');

      vi.mocked(timeGreetingModule.getTimeGreetingConfig)
        .mockReturnValueOnce(morningConfig) // Initial render
        .mockReturnValue(afternoonConfig);  // After interval

      const { result } = renderHook(() => useTimeBasedGreeting());

      expect(result.current.period).toBe('morning');

      // Advance time by 60 seconds (interval duration)
      act(() => {
        vi.advanceTimersByTime(60000);
      });

      expect(result.current.period).toBe('afternoon');
    });

    it('does not trigger re-render when period stays the same', () => {
      const morningConfig = createMockConfig('morning');

      vi.mocked(timeGreetingModule.getTimeGreetingConfig).mockReturnValue(morningConfig);

      const { result } = renderHook(() => useTimeBasedGreeting());

      const initialConfig = result.current.config;

      // Advance time by 60 seconds
      act(() => {
        vi.advanceTimersByTime(60000);
      });

      // Config object should be the same reference since period didn't change
      expect(result.current.config).toBe(initialConfig);
      expect(result.current.period).toBe('morning');
    });

    it('checks every 60000ms (60 seconds)', () => {
      const morningConfig = createMockConfig('morning');
      vi.mocked(timeGreetingModule.getTimeGreetingConfig).mockReturnValue(morningConfig);

      renderHook(() => useTimeBasedGreeting());

      // Initial call
      expect(timeGreetingModule.getTimeGreetingConfig).toHaveBeenCalledTimes(1);

      // Advance 59 seconds - should not trigger another call
      act(() => {
        vi.advanceTimersByTime(59000);
      });
      expect(timeGreetingModule.getTimeGreetingConfig).toHaveBeenCalledTimes(1);

      // Advance 1 more second (total 60s) - should trigger interval
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(timeGreetingModule.getTimeGreetingConfig).toHaveBeenCalledTimes(2);

      // Advance another 60 seconds
      act(() => {
        vi.advanceTimersByTime(60000);
      });
      expect(timeGreetingModule.getTimeGreetingConfig).toHaveBeenCalledTimes(3);
    });

    it('cleans up interval on unmount', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      const morningConfig = createMockConfig('morning');
      vi.mocked(timeGreetingModule.getTimeGreetingConfig).mockReturnValue(morningConfig);

      const { unmount } = renderHook(() => useTimeBasedGreeting());

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });
  });

  describe('Reduced motion listener', () => {
    it('responds to preference change via media query listener', () => {
      vi.mocked(timeGreetingModule.prefersReducedMotion).mockReturnValue(false);

      const { result } = renderHook(() => useTimeBasedGreeting());

      expect(result.current.reducedMotion).toBe(false);

      // Simulate media query change event
      act(() => {
        (mockMediaQueryList as ReturnType<typeof createMockMediaQueryList>)._triggerChange(true);
      });

      expect(result.current.reducedMotion).toBe(true);
    });

    it('cleans up event listener on unmount', () => {
      const { unmount } = renderHook(() => useTimeBasedGreeting());

      // Verify addEventListener was called
      expect(mockMediaQueryList.addEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );

      unmount();

      // Verify removeEventListener was called
      expect(mockMediaQueryList.removeEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });
  });

  describe('Return value', () => {
    it('returns object with config, period, reducedMotion, refresh properties', () => {
      const mockConfig = createMockConfig('night');
      vi.mocked(timeGreetingModule.getTimeGreetingConfig).mockReturnValue(mockConfig);
      vi.mocked(timeGreetingModule.prefersReducedMotion).mockReturnValue(true);

      const { result } = renderHook(() => useTimeBasedGreeting());

      // Check all properties exist
      expect(result.current).toHaveProperty('config');
      expect(result.current).toHaveProperty('period');
      expect(result.current).toHaveProperty('reducedMotion');
      expect(result.current).toHaveProperty('refresh');

      // Check property types
      expect(typeof result.current.config).toBe('object');
      expect(typeof result.current.period).toBe('string');
      expect(typeof result.current.reducedMotion).toBe('boolean');
      expect(typeof result.current.refresh).toBe('function');

      // Check values
      expect(result.current.config).toEqual(mockConfig);
      expect(result.current.period).toBe('night');
      expect(result.current.reducedMotion).toBe(true);
    });
  });
});
