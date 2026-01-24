/**
 * Time-based greeting utility for myGenAssist Studio
 * Provides contextual greetings and gradient configurations based on time of day
 */

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export interface TimeGreetingConfig {
  period: TimeOfDay;
  greetingKey: string;
  taglineKey: string;
  gradientColors: string[];
}

/**
 * Brand colors for myGenAssist Studio
 */
export const BRAND_COLORS = {
  green: '#8AD32A',
  blue: '#00BCFF',
  cyan: '#73FCFC',
  teal: '#1BC1D5',
} as const;

/**
 * Time-specific gradient configurations
 */
export const TIME_GRADIENTS: Record<TimeOfDay, string[]> = {
  morning: ['#8AD32A', '#FFD700', '#FFA500', '#8AD32A'],   // Warm sunrise
  afternoon: ['#00BCFF', '#8AD32A', '#1BC1D5', '#00BCFF'], // Bright productive
  evening: ['#1BC1D5', '#73FCFC', '#00BCFF', '#1BC1D5'],   // Cool wind-down
  night: ['#1BC1D5', '#4B0082', '#73FCFC', '#1BC1D5'],     // Deep focus
};

/**
 * Determines the time of day based on current hour
 * Morning: 5am - 12pm
 * Afternoon: 12pm - 5pm
 * Evening: 5pm - 9pm
 * Night: 9pm - 5am
 */
export function getTimeOfDay(date: Date = new Date()): TimeOfDay {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) {
    return 'morning';
  } else if (hour >= 12 && hour < 17) {
    return 'afternoon';
  } else if (hour >= 17 && hour < 21) {
    return 'evening';
  } else {
    return 'night';
  }
}

/**
 * Returns the complete greeting configuration for the current time
 */
export function getTimeGreetingConfig(date: Date = new Date()): TimeGreetingConfig {
  const period = getTimeOfDay(date);

  return {
    period,
    greetingKey: `layout.greeting-${period}`,
    taglineKey: `layout.tagline-${period}`,
    gradientColors: TIME_GRADIENTS[period],
  };
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
