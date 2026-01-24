import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AnimatedWelcome } from '../../../src/components/AnimatedWelcome/index';
import type { TimeGreetingConfig } from '../../../src/lib/timeGreeting';

// Mock useTimeBasedGreeting hook
const mockConfig: TimeGreetingConfig = {
  period: 'morning',
  greetingKey: 'layout.greeting-morning',
  taglineKey: 'layout.tagline-morning',
  gradientColors: ['#8AD32A', '#FFD700', '#FFA500', '#8AD32A'],
};

const mockUseTimeBasedGreeting = vi.fn(() => ({
  config: mockConfig,
  period: mockConfig.period,
  reducedMotion: false,
  refresh: vi.fn(),
}));

vi.mock('../../../src/hooks/useTimeBasedGreeting', () => ({
  useTimeBasedGreeting: () => mockUseTimeBasedGreeting(),
}));

vi.mock('@/hooks/useTimeBasedGreeting', () => ({
  useTimeBasedGreeting: () => mockUseTimeBasedGreeting(),
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'layout.greeting-morning': 'Good morning!',
        'layout.greeting-afternoon': 'Good afternoon!',
        'layout.greeting-evening': 'Good evening!',
        'layout.greeting-night': 'Good night!',
        'layout.tagline-morning': 'Rise and shine!',
        'layout.tagline-afternoon': 'Keep up the great work!',
        'layout.tagline-evening': 'Winding down nicely.',
        'layout.tagline-night': 'Burning the midnight oil?',
        'layout.how-can-i-help-you': 'How can I help you?',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock BlurText component
vi.mock('../../../src/components/ui/BlurText', () => ({
  BlurText: ({ text, delay, animateBy, className }: { text: string; delay?: number; animateBy?: string; className?: string }) => (
    <span data-testid="blur-text" data-delay={delay} data-animate-by={animateBy} className={className}>
      {text}
    </span>
  ),
}));

vi.mock('@/components/ui/BlurText', () => ({
  BlurText: ({ text, delay, animateBy, className }: { text: string; delay?: number; animateBy?: string; className?: string }) => (
    <span data-testid="blur-text" data-delay={delay} data-animate-by={animateBy} className={className}>
      {text}
    </span>
  ),
}));

// Mock GradientText component
vi.mock('../../../src/components/ui/GradientText', () => ({
  GradientText: ({ children, colors, animationSpeed, className }: { children: React.ReactNode; colors?: string[]; animationSpeed?: number; className?: string }) => (
    <span data-testid="gradient-text" data-colors={JSON.stringify(colors)} data-animation-speed={animationSpeed} className={className}>
      {children}
    </span>
  ),
}));

vi.mock('@/components/ui/GradientText', () => ({
  GradientText: ({ children, colors, animationSpeed, className }: { children: React.ReactNode; colors?: string[]; animationSpeed?: number; className?: string }) => (
    <span data-testid="gradient-text" data-colors={JSON.stringify(colors)} data-animation-speed={animationSpeed} className={className}>
      {children}
    </span>
  ),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({
      children,
      className,
      onAnimationComplete,
      initial,
      animate,
      transition,
      ...props
    }: {
      children?: React.ReactNode;
      className?: string;
      onAnimationComplete?: () => void;
      initial?: object;
      animate?: object;
      transition?: object;
      [key: string]: unknown;
    }) => {
      // Immediately trigger onAnimationComplete for testing purposes
      if (onAnimationComplete) {
        setTimeout(() => onAnimationComplete(), 0);
      }
      return (
        <div
          className={className}
          data-testid="motion-div"
          data-initial={JSON.stringify(initial)}
          data-animate={JSON.stringify(animate)}
          data-transition={JSON.stringify(transition)}
          {...props}
        >
          {children}
        </div>
      );
    },
  },
}));

describe('AnimatedWelcome Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default mock values
    mockUseTimeBasedGreeting.mockReturnValue({
      config: mockConfig,
      period: mockConfig.period,
      reducedMotion: false,
      refresh: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders greeting text', () => {
      render(<AnimatedWelcome />);

      const blurText = screen.getByTestId('blur-text');
      expect(blurText).toBeInTheDocument();
      expect(blurText).toHaveTextContent('Good morning!');
    });

    it('renders tagline text', () => {
      render(<AnimatedWelcome />);

      const gradientText = screen.getByTestId('gradient-text');
      expect(gradientText).toBeInTheDocument();
      expect(gradientText).toHaveTextContent('Rise and shine!');
    });

    it('renders help text "How can I help you?"', () => {
      render(<AnimatedWelcome />);

      expect(screen.getByText('How can I help you?')).toBeInTheDocument();
    });

    it('applies custom className prop', () => {
      const { container } = render(<AnimatedWelcome className="custom-class test-class" />);

      const rootElement = container.firstChild as HTMLElement;
      expect(rootElement).toHaveClass('custom-class');
      expect(rootElement).toHaveClass('test-class');
      // Also verify default classes are preserved
      expect(rootElement).toHaveClass('flex');
      expect(rootElement).toHaveClass('flex-col');
      expect(rootElement).toHaveClass('items-center');
    });
  });

  describe('Callback Behavior', () => {
    it('calls onAnimationComplete callback when provided', async () => {
      const onAnimationComplete = vi.fn();

      render(<AnimatedWelcome onAnimationComplete={onAnimationComplete} />);

      // Wait for the mocked animation to complete (setTimeout with 0)
      await waitFor(() => {
        expect(onAnimationComplete).toHaveBeenCalled();
      });
    });
  });

  describe('Reduced Motion Support', () => {
    it('respects reducedMotion by setting faster animation delays', () => {
      mockUseTimeBasedGreeting.mockReturnValue({
        config: mockConfig,
        period: mockConfig.period,
        reducedMotion: true,
        refresh: vi.fn(),
      });

      render(<AnimatedWelcome />);

      // BlurText should receive delay of 0 when reducedMotion is true
      const blurText = screen.getByTestId('blur-text');
      expect(blurText).toHaveAttribute('data-delay', '0');

      // motion.div elements should have transition with duration: 0 and delay: 0
      const motionDivs = screen.getAllByTestId('motion-div');
      motionDivs.forEach((div) => {
        const transition = JSON.parse(div.getAttribute('data-transition') || '{}');
        expect(transition.duration).toBe(0);
        expect(transition.delay).toBe(0);
      });
    });

    it('uses normal animation delays when reducedMotion is false', () => {
      mockUseTimeBasedGreeting.mockReturnValue({
        config: mockConfig,
        period: mockConfig.period,
        reducedMotion: false,
        refresh: vi.fn(),
      });

      render(<AnimatedWelcome />);

      // BlurText should receive normal delay (80)
      const blurText = screen.getByTestId('blur-text');
      expect(blurText).toHaveAttribute('data-delay', '80');

      // motion.div elements should have normal transition values
      const motionDivs = screen.getAllByTestId('motion-div');
      motionDivs.forEach((div) => {
        const transition = JSON.parse(div.getAttribute('data-transition') || '{}');
        expect(transition.duration).toBe(0.5);
      });
    });
  });

  describe('Period Changes', () => {
    it('updates when period changes', () => {
      // Render with morning config
      const { rerender } = render(<AnimatedWelcome />);

      expect(screen.getByTestId('blur-text')).toHaveTextContent('Good morning!');
      expect(screen.getByTestId('gradient-text')).toHaveTextContent('Rise and shine!');

      // Update mock to afternoon config
      const afternoonConfig: TimeGreetingConfig = {
        period: 'afternoon',
        greetingKey: 'layout.greeting-afternoon',
        taglineKey: 'layout.tagline-afternoon',
        gradientColors: ['#00BCFF', '#8AD32A', '#1BC1D5', '#00BCFF'],
      };

      mockUseTimeBasedGreeting.mockReturnValue({
        config: afternoonConfig,
        period: afternoonConfig.period,
        reducedMotion: false,
        refresh: vi.fn(),
      });

      // Rerender component
      rerender(<AnimatedWelcome />);

      expect(screen.getByTestId('blur-text')).toHaveTextContent('Good afternoon!');
      expect(screen.getByTestId('gradient-text')).toHaveTextContent('Keep up the great work!');
    });

    it('uses correct gradient colors for each period', () => {
      // Test morning gradient colors
      render(<AnimatedWelcome />);

      const gradientText = screen.getByTestId('gradient-text');
      const colors = JSON.parse(gradientText.getAttribute('data-colors') || '[]');
      expect(colors).toEqual(['#8AD32A', '#FFD700', '#FFA500', '#8AD32A']);
    });
  });

  describe('Animation Configuration', () => {
    it('passes correct animateBy prop to BlurText', () => {
      render(<AnimatedWelcome />);

      const blurText = screen.getByTestId('blur-text');
      expect(blurText).toHaveAttribute('data-animate-by', 'words');
    });

    it('passes correct animationSpeed to GradientText', () => {
      render(<AnimatedWelcome />);

      const gradientText = screen.getByTestId('gradient-text');
      expect(gradientText).toHaveAttribute('data-animation-speed', '4');
    });
  });

  describe('Snapshot', () => {
    it('matches snapshot for visual regression', () => {
      const { container } = render(<AnimatedWelcome className="test-snapshot" />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with reduced motion enabled', () => {
      mockUseTimeBasedGreeting.mockReturnValue({
        config: mockConfig,
        period: mockConfig.period,
        reducedMotion: true,
        refresh: vi.fn(),
      });

      const { container } = render(<AnimatedWelcome className="reduced-motion-snapshot" />);
      expect(container).toMatchSnapshot();
    });
  });
});
