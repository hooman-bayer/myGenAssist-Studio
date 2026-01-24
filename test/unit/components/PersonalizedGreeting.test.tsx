// Unit tests for PersonalizedGreeting component
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PersonalizedGreeting } from '../../../src/components/PersonalizedGreeting/index';
import type { TimeGreetingConfig } from '../../../src/lib/timeGreeting';

// Mock useTimeBasedGreeting hook
const mockUseTimeBasedGreeting = vi.fn();
vi.mock('../../../src/hooks/useTimeBasedGreeting', () => ({
  useTimeBasedGreeting: () => mockUseTimeBasedGreeting(),
}));
vi.mock('@/hooks/useTimeBasedGreeting', () => ({
  useTimeBasedGreeting: () => mockUseTimeBasedGreeting(),
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'layout.greeting-morning': 'Good morning',
        'layout.greeting-afternoon': 'Good afternoon',
        'layout.greeting-evening': 'Good evening',
        'layout.greeting-night': 'Good night',
        'layout.tagline-morning': 'ready to start your day',
        'layout.tagline-afternoon': 'keep up the momentum',
        'layout.tagline-evening': 'wrapping up nicely',
        'layout.tagline-night': 'burning the midnight oil',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock framer-motion to render static elements for testing
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, style, animate, ...props }: any) => {
      // Convert style object to CSS string for data attribute
      const styleString = style
        ? Object.entries(style)
            .map(([key, value]) => `${key}: ${value}`)
            .join('; ')
        : '';
      return (
        <div
          data-testid="motion-div"
          style={style}
          data-style={styleString}
          data-animate={JSON.stringify(animate)}
          {...props}
        >
          {children}
        </div>
      );
    },
    span: ({ children, style, ...props }: any) => (
      <span data-testid="motion-span" style={style} {...props}>
        {children}
      </span>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock BlurText component
vi.mock('../../../src/components/ui/BlurText', () => ({
  BlurText: ({ text, delay, className }: { text: string; delay?: number; className?: string }) => (
    <span data-testid="blur-text" data-delay={delay} className={className}>
      {text}
    </span>
  ),
}));
vi.mock('@/components/ui/BlurText', () => ({
  BlurText: ({ text, delay, className }: { text: string; delay?: number; className?: string }) => (
    <span data-testid="blur-text" data-delay={delay} className={className}>
      {text}
    </span>
  ),
}));

describe('PersonalizedGreeting Component', () => {
  const defaultMockConfig: TimeGreetingConfig = {
    period: 'morning',
    greetingKey: 'layout.greeting-morning',
    taglineKey: 'layout.tagline-morning',
    gradientColors: ['#8AD32A', '#FFD700', '#FFA500', '#8AD32A'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTimeBasedGreeting.mockReturnValue({
      config: defaultMockConfig,
      period: 'morning',
      reducedMotion: false,
      refresh: vi.fn(),
    });
  });

  describe('Name Extraction', () => {
    it('should extract first name from full name', () => {
      render(<PersonalizedGreeting name="John Doe" />);

      const blurText = screen.getByTestId('blur-text');
      expect(blurText).toHaveTextContent('John');
      expect(blurText).not.toHaveTextContent('Doe');
    });

    it('should handle single name', () => {
      render(<PersonalizedGreeting name="John" />);

      const blurText = screen.getByTestId('blur-text');
      expect(blurText).toHaveTextContent('John');
    });

    it('should handle empty name gracefully', () => {
      render(<PersonalizedGreeting name="" />);

      const blurText = screen.getByTestId('blur-text');
      // When name is empty, split('')[0] returns undefined, fallback to original empty string
      expect(blurText).toHaveTextContent('');
    });
  });

  describe('Time-based Greeting', () => {
    it('should render morning greeting text', () => {
      mockUseTimeBasedGreeting.mockReturnValue({
        config: {
          ...defaultMockConfig,
          period: 'morning',
          greetingKey: 'layout.greeting-morning',
          taglineKey: 'layout.tagline-morning',
        },
        period: 'morning',
        reducedMotion: false,
        refresh: vi.fn(),
      });

      render(<PersonalizedGreeting name="Test User" />);

      expect(screen.getByText('Good morning,')).toBeInTheDocument();
      expect(screen.getByText(/ready to start your day/)).toBeInTheDocument();
    });

    it('should render afternoon greeting text', () => {
      mockUseTimeBasedGreeting.mockReturnValue({
        config: {
          period: 'afternoon',
          greetingKey: 'layout.greeting-afternoon',
          taglineKey: 'layout.tagline-afternoon',
          gradientColors: ['#00BCFF', '#8AD32A', '#1BC1D5', '#00BCFF'],
        },
        period: 'afternoon',
        reducedMotion: false,
        refresh: vi.fn(),
      });

      render(<PersonalizedGreeting name="Test User" />);

      expect(screen.getByText('Good afternoon,')).toBeInTheDocument();
      expect(screen.getByText(/keep up the momentum/)).toBeInTheDocument();
    });

    it('should render evening greeting text', () => {
      mockUseTimeBasedGreeting.mockReturnValue({
        config: {
          period: 'evening',
          greetingKey: 'layout.greeting-evening',
          taglineKey: 'layout.tagline-evening',
          gradientColors: ['#1BC1D5', '#73FCFC', '#00BCFF', '#1BC1D5'],
        },
        period: 'evening',
        reducedMotion: false,
        refresh: vi.fn(),
      });

      render(<PersonalizedGreeting name="Test User" />);

      expect(screen.getByText('Good evening,')).toBeInTheDocument();
      expect(screen.getByText(/wrapping up nicely/)).toBeInTheDocument();
    });

    it('should render night greeting text', () => {
      mockUseTimeBasedGreeting.mockReturnValue({
        config: {
          period: 'night',
          greetingKey: 'layout.greeting-night',
          taglineKey: 'layout.tagline-night',
          gradientColors: ['#1BC1D5', '#4B0082', '#73FCFC', '#1BC1D5'],
        },
        period: 'night',
        reducedMotion: false,
        refresh: vi.fn(),
      });

      render(<PersonalizedGreeting name="Test User" />);

      expect(screen.getByText('Good night,')).toBeInTheDocument();
      expect(screen.getByText(/burning the midnight oil/)).toBeInTheDocument();
    });
  });

  describe('Gradient Colors', () => {
    it('should apply gradient colors from time config to tagline', () => {
      const testColors = ['#FF0000', '#00FF00', '#0000FF', '#FF0000'];
      mockUseTimeBasedGreeting.mockReturnValue({
        config: {
          ...defaultMockConfig,
          gradientColors: testColors,
        },
        period: 'morning',
        reducedMotion: false,
        refresh: vi.fn(),
      });

      render(<PersonalizedGreeting name="Test User" />);

      // Find the tagline span (the one with gradient style)
      const motionSpans = screen.getAllByTestId('motion-span');
      const taglineSpan = motionSpans.find((span) => {
        const style = span.getAttribute('style');
        return style && style.includes('linear-gradient');
      });

      expect(taglineSpan).toBeDefined();
      expect(taglineSpan?.getAttribute('style')).toContain('#FF0000');
      expect(taglineSpan?.getAttribute('style')).toContain('#00FF00');
    });

    it('should apply gradient colors to backdrop radial gradient', () => {
      const testColors = ['#AABBCC', '#DDEEFF', '#112233', '#AABBCC'];
      mockUseTimeBasedGreeting.mockReturnValue({
        config: {
          ...defaultMockConfig,
          gradientColors: testColors,
        },
        period: 'morning',
        reducedMotion: false,
        refresh: vi.fn(),
      });

      render(<PersonalizedGreeting name="Test User" />);

      const motionDiv = screen.getByTestId('motion-div');
      const style = motionDiv.getAttribute('data-style');

      expect(style).toContain('#AABBCC');
      expect(style).toContain('#DDEEFF');
    });
  });

  describe('Reduced Motion', () => {
    it('should disable animations when reducedMotion is true', () => {
      mockUseTimeBasedGreeting.mockReturnValue({
        config: defaultMockConfig,
        period: 'morning',
        reducedMotion: true,
        refresh: vi.fn(),
      });

      render(<PersonalizedGreeting name="Test User" />);

      // Check that BlurText receives delay of 0 when reduced motion is enabled
      const blurText = screen.getByTestId('blur-text');
      expect(blurText.getAttribute('data-delay')).toBe('0');
    });

    it('should enable animations when reducedMotion is false', () => {
      mockUseTimeBasedGreeting.mockReturnValue({
        config: defaultMockConfig,
        period: 'morning',
        reducedMotion: false,
        refresh: vi.fn(),
      });

      render(<PersonalizedGreeting name="Test User" />);

      // Check that BlurText receives non-zero delay when reduced motion is disabled
      const blurText = screen.getByTestId('blur-text');
      expect(blurText.getAttribute('data-delay')).toBe('35');
    });

    it('should pass empty animate object to backdrop when reducedMotion is true', () => {
      mockUseTimeBasedGreeting.mockReturnValue({
        config: defaultMockConfig,
        period: 'morning',
        reducedMotion: true,
        refresh: vi.fn(),
      });

      render(<PersonalizedGreeting name="Test User" />);

      const motionDiv = screen.getByTestId('motion-div');
      const animateAttr = motionDiv.getAttribute('data-animate');

      // When reducedMotion is true, animate should be empty object
      expect(animateAttr).toBe('{}');
    });

    it('should pass opacity animation to backdrop when reducedMotion is false', () => {
      mockUseTimeBasedGreeting.mockReturnValue({
        config: defaultMockConfig,
        period: 'morning',
        reducedMotion: false,
        refresh: vi.fn(),
      });

      render(<PersonalizedGreeting name="Test User" />);

      const motionDiv = screen.getByTestId('motion-div');
      const animateAttr = motionDiv.getAttribute('data-animate');

      // When reducedMotion is false, animate should contain opacity array
      expect(animateAttr).toContain('opacity');
    });
  });

  describe('Custom className', () => {
    it('should apply custom className to container', () => {
      render(<PersonalizedGreeting name="Test User" className="custom-class" />);

      const container = screen.getByTestId('blur-text').closest('.relative');
      expect(container).toHaveClass('custom-class');
    });

    it('should work with default empty className', () => {
      render(<PersonalizedGreeting name="Test User" />);

      const container = screen.getByTestId('blur-text').closest('.relative');
      expect(container).toHaveClass('relative');
    });
  });
});
