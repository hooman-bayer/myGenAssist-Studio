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

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getTimeOfDay,
  getTimeGreetingConfig,
  prefersReducedMotion,
  TIME_GRADIENTS,
  BRAND_COLORS,
  TimeOfDay,
} from '@/lib/timeGreeting';

/**
 * Helper to create a Date object at a specific hour
 */
function createDateAtHour(hour: number, minutes: number = 0): Date {
  const date = new Date(2025, 0, 15); // January 15, 2025
  date.setHours(hour, minutes, 0, 0);
  return date;
}

describe('timeGreeting', () => {
  describe('getTimeOfDay', () => {
    describe('morning boundaries (5:00 AM - 11:59 AM)', () => {
      it('returns "morning" for 5:00 AM (boundary start)', () => {
        const date = createDateAtHour(5, 0);
        expect(getTimeOfDay(date)).toBe('morning');
      });

      it('returns "morning" for 11:59 AM (boundary end)', () => {
        const date = createDateAtHour(11, 59);
        expect(getTimeOfDay(date)).toBe('morning');
      });
    });

    describe('afternoon boundaries (12:00 PM - 4:59 PM)', () => {
      it('returns "afternoon" for 12:00 PM (boundary start)', () => {
        const date = createDateAtHour(12, 0);
        expect(getTimeOfDay(date)).toBe('afternoon');
      });

      it('returns "afternoon" for 4:59 PM (boundary end)', () => {
        const date = createDateAtHour(16, 59);
        expect(getTimeOfDay(date)).toBe('afternoon');
      });
    });

    describe('evening boundaries (5:00 PM - 8:59 PM)', () => {
      it('returns "evening" for 5:00 PM (boundary start)', () => {
        const date = createDateAtHour(17, 0);
        expect(getTimeOfDay(date)).toBe('evening');
      });

      it('returns "evening" for 8:59 PM (boundary end)', () => {
        const date = createDateAtHour(20, 59);
        expect(getTimeOfDay(date)).toBe('evening');
      });
    });

    describe('night boundaries (9:00 PM - 4:59 AM)', () => {
      it('returns "night" for 9:00 PM (boundary start)', () => {
        const date = createDateAtHour(21, 0);
        expect(getTimeOfDay(date)).toBe('night');
      });

      it('returns "night" for 4:59 AM (boundary end)', () => {
        const date = createDateAtHour(4, 59);
        expect(getTimeOfDay(date)).toBe('night');
      });

      it('returns "night" for midnight (0:00)', () => {
        const date = createDateAtHour(0, 0);
        expect(getTimeOfDay(date)).toBe('night');
      });
    });

    describe('default parameter', () => {
      it('uses current date when no argument provided', () => {
        // Mock Date to return a specific time
        const mockDate = createDateAtHour(10, 0); // 10 AM = morning
        vi.useFakeTimers();
        vi.setSystemTime(mockDate);

        const result = getTimeOfDay();
        expect(result).toBe('morning');

        vi.useRealTimers();
      });
    });
  });

  describe('getTimeGreetingConfig', () => {
    it('returns correct config for morning', () => {
      const date = createDateAtHour(8, 0);
      const config = getTimeGreetingConfig(date);

      expect(config.period).toBe('morning');
      expect(config.greetingKey).toBe('layout.greeting-morning');
      expect(config.taglineKey).toBe('layout.tagline-morning');
      expect(config.gradientColors).toEqual(TIME_GRADIENTS.morning);
    });

    it('returns correct config for afternoon', () => {
      const date = createDateAtHour(14, 0);
      const config = getTimeGreetingConfig(date);

      expect(config.period).toBe('afternoon');
      expect(config.greetingKey).toBe('layout.greeting-afternoon');
      expect(config.taglineKey).toBe('layout.tagline-afternoon');
      expect(config.gradientColors).toEqual(TIME_GRADIENTS.afternoon);
    });

    it('returns correct config for evening', () => {
      const date = createDateAtHour(19, 0);
      const config = getTimeGreetingConfig(date);

      expect(config.period).toBe('evening');
      expect(config.greetingKey).toBe('layout.greeting-evening');
      expect(config.taglineKey).toBe('layout.tagline-evening');
      expect(config.gradientColors).toEqual(TIME_GRADIENTS.evening);
    });

    it('returns correct config for night', () => {
      const date = createDateAtHour(23, 0);
      const config = getTimeGreetingConfig(date);

      expect(config.period).toBe('night');
      expect(config.greetingKey).toBe('layout.greeting-night');
      expect(config.taglineKey).toBe('layout.tagline-night');
      expect(config.gradientColors).toEqual(TIME_GRADIENTS.night);
    });

    it('greetingKey follows "layout.greeting-{period}" pattern', () => {
      const periods: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'night'];
      const testHours = [8, 14, 19, 23]; // representative hours for each period

      periods.forEach((period, index) => {
        const date = createDateAtHour(testHours[index]);
        const config = getTimeGreetingConfig(date);
        expect(config.greetingKey).toBe(`layout.greeting-${period}`);
      });
    });

    it('taglineKey follows "layout.tagline-{period}" pattern', () => {
      const periods: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'night'];
      const testHours = [8, 14, 19, 23]; // representative hours for each period

      periods.forEach((period, index) => {
        const date = createDateAtHour(testHours[index]);
        const config = getTimeGreetingConfig(date);
        expect(config.taglineKey).toBe(`layout.tagline-${period}`);
      });
    });

    it('gradientColors matches TIME_GRADIENTS for the period', () => {
      const periods: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'night'];
      const testHours = [8, 14, 19, 23];

      periods.forEach((period, index) => {
        const date = createDateAtHour(testHours[index]);
        const config = getTimeGreetingConfig(date);
        expect(config.gradientColors).toBe(TIME_GRADIENTS[period]);
      });
    });
  });

  describe('prefersReducedMotion', () => {
    const originalWindow = global.window;

    afterEach(() => {
      // Restore original window
      global.window = originalWindow;
      vi.restoreAllMocks();
    });

    it('returns false in SSR environment (window undefined)', () => {
      // Temporarily make window undefined
      // @ts-expect-error - intentionally setting window to undefined for SSR test
      delete global.window;

      const result = prefersReducedMotion();
      expect(result).toBe(false);

      // Restore window for other tests
      global.window = originalWindow;
    });

    it('returns false when matchMedia does not match reduced motion', () => {
      const mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      global.window = {
        ...originalWindow,
        matchMedia: mockMatchMedia,
      } as typeof window;

      const result = prefersReducedMotion();
      expect(result).toBe(false);
      expect(mockMatchMedia).toHaveBeenCalledWith(
        '(prefers-reduced-motion: reduce)'
      );
    });

    it('returns true when matchMedia matches reduced motion', () => {
      const mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      global.window = {
        ...originalWindow,
        matchMedia: mockMatchMedia,
      } as typeof window;

      const result = prefersReducedMotion();
      expect(result).toBe(true);
      expect(mockMatchMedia).toHaveBeenCalledWith(
        '(prefers-reduced-motion: reduce)'
      );
    });
  });

  describe('Constants', () => {
    describe('TIME_GRADIENTS', () => {
      it('has 4 colors for morning period', () => {
        expect(TIME_GRADIENTS.morning).toHaveLength(4);
      });

      it('has 4 colors for afternoon period', () => {
        expect(TIME_GRADIENTS.afternoon).toHaveLength(4);
      });

      it('has 4 colors for evening period', () => {
        expect(TIME_GRADIENTS.evening).toHaveLength(4);
      });

      it('has 4 colors for night period', () => {
        expect(TIME_GRADIENTS.night).toHaveLength(4);
      });
    });

    describe('BRAND_COLORS', () => {
      it('contains green with expected hex value', () => {
        expect(BRAND_COLORS.green).toBe('#8AD32A');
      });

      it('contains blue with expected hex value', () => {
        expect(BRAND_COLORS.blue).toBe('#00BCFF');
      });

      it('contains cyan with expected hex value', () => {
        expect(BRAND_COLORS.cyan).toBe('#73FCFC');
      });

      it('contains teal with expected hex value', () => {
        expect(BRAND_COLORS.teal).toBe('#1BC1D5');
      });
    });
  });
});
