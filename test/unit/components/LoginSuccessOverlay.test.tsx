import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';

// Mock prefersReducedMotion from timeGreeting
const mockPrefersReducedMotion = vi.fn(() => false);
vi.mock('../../../src/lib/timeGreeting', () => ({
  prefersReducedMotion: () => mockPrefersReducedMotion(),
  BRAND_COLORS: {
    green: '#8AD32A',
    blue: '#00BCFF',
    cyan: '#73FCFC',
    teal: '#1BC1D5',
  },
}));

// Mock framer-motion components
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: React.ComponentProps<'div'>) => (
      <div data-testid="motion-div" {...props}>
        {children}
      </div>
    ),
    svg: ({ children, ...props }: React.ComponentProps<'svg'>) => (
      <svg data-testid="motion-svg" {...props}>
        {children}
      </svg>
    ),
    circle: (props: React.ComponentProps<'circle'>) => (
      <circle data-testid="motion-circle" {...props} />
    ),
    path: (props: React.ComponentProps<'path'>) => (
      <path data-testid="motion-path" {...props} />
    ),
  },
}));

// Mock BlurText component
vi.mock('../../../src/components/ui/BlurText', () => ({
  BlurText: ({ text }: { text: string }) => (
    <span data-testid="blur-text">{text}</span>
  ),
}));

// Mock useTranslation hook
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      if (key === 'layout.welcome-back') return 'Welcome back';
      return key;
    },
  }),
}));

// Import component after mocks are set up
import { LoginSuccessOverlay } from '../../../src/components/LoginSuccessOverlay/index';

describe('LoginSuccessOverlay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockPrefersReducedMotion.mockReturnValue(false);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('Visibility', () => {
    it('should not render when isVisible is false', () => {
      const onComplete = vi.fn();
      const { container } = render(
        <LoginSuccessOverlay isVisible={false} onComplete={onComplete} />
      );

      // When not visible, the overlay content should not be in the DOM
      expect(container.querySelector('svg')).toBeNull();
      expect(screen.queryByText('Welcome back')).toBeNull();
    });

    it('should render when isVisible is true', () => {
      const onComplete = vi.fn();
      const { container } = render(
        <LoginSuccessOverlay isVisible={true} onComplete={onComplete} />
      );

      // When visible, the overlay should render with the checkmark SVG
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Animation sequence and callbacks', () => {
    it('should call onComplete callback after animation sequence', async () => {
      const onComplete = vi.fn();
      render(<LoginSuccessOverlay isVisible={true} onComplete={onComplete} />);

      // onComplete should not be called initially
      expect(onComplete).not.toHaveBeenCalled();

      // Advance time past the complete timer (1200ms)
      await act(async () => {
        vi.advanceTimersByTime(1200);
      });

      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('should respect reduced motion preference and complete quickly (~300ms)', async () => {
      mockPrefersReducedMotion.mockReturnValue(true);

      const onComplete = vi.fn();
      render(<LoginSuccessOverlay isVisible={true} onComplete={onComplete} />);

      // Should not be called before 300ms
      await act(async () => {
        vi.advanceTimersByTime(299);
      });
      expect(onComplete).not.toHaveBeenCalled();

      // Should be called at 300ms
      await act(async () => {
        vi.advanceTimersByTime(1);
      });
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('should progress through phases: checkmark -> text -> exit', async () => {
      const onComplete = vi.fn();
      render(<LoginSuccessOverlay isVisible={true} onComplete={onComplete} />);

      // Initial phase is 'checkmark' - BlurText should not be visible yet
      // (text renders but with opacity 0 in checkmark phase)

      // At initial render, we're in checkmark phase
      // Advance to text phase (350ms)
      await act(async () => {
        vi.advanceTimersByTime(350);
      });

      // Now in text phase - BlurText should be rendered
      expect(screen.getByTestId('blur-text')).toBeInTheDocument();

      // Advance to exit phase (900ms total - already at 350, need 550 more)
      await act(async () => {
        vi.advanceTimersByTime(550);
      });

      // Now in exit phase - component still rendered but animating out
      expect(screen.getByTestId('blur-text')).toBeInTheDocument();

      // Advance to completion (1200ms total - already at 900, need 300 more)
      await act(async () => {
        vi.advanceTimersByTime(300);
      });
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('Phase reset behavior', () => {
    it('should reset phase when isVisible toggles from false to true', async () => {
      const onComplete = vi.fn();
      const { rerender } = render(
        <LoginSuccessOverlay isVisible={true} onComplete={onComplete} />
      );

      // Progress through animation
      await act(async () => {
        vi.advanceTimersByTime(900); // Now in exit phase
      });

      // Hide the overlay
      rerender(<LoginSuccessOverlay isVisible={false} onComplete={onComplete} />);

      // Clear the mock to track new calls
      onComplete.mockClear();

      // Show the overlay again
      rerender(<LoginSuccessOverlay isVisible={true} onComplete={onComplete} />);

      // Phase should be reset to 'checkmark'
      // Verify by checking that onComplete is not called immediately
      expect(onComplete).not.toHaveBeenCalled();

      // Should need full animation cycle again
      await act(async () => {
        vi.advanceTimersByTime(1200);
      });
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('SVG rendering', () => {
    it('should render checkmark SVG elements', () => {
      const onComplete = vi.fn();
      const { container } = render(
        <LoginSuccessOverlay isVisible={true} onComplete={onComplete} />
      );

      // Should render the SVG element
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('viewBox', '0 0 80 80');
      expect(svg).toHaveAttribute('width', '80');
      expect(svg).toHaveAttribute('height', '80');

      // Should render circle background (motion.circle)
      const circle = screen.getByTestId('motion-circle');
      expect(circle).toBeInTheDocument();
      expect(circle).toHaveAttribute('cx', '40');
      expect(circle).toHaveAttribute('cy', '40');
      expect(circle).toHaveAttribute('r', '36');

      // Should render checkmark path (motion.path)
      const path = screen.getByTestId('motion-path');
      expect(path).toBeInTheDocument();
      expect(path).toHaveAttribute('d', 'M24 42L34 52L56 30');
    });
  });

  describe('Welcome text rendering', () => {
    it('should render welcome text', async () => {
      const onComplete = vi.fn();
      render(<LoginSuccessOverlay isVisible={true} onComplete={onComplete} />);

      // Advance to text phase
      await act(async () => {
        vi.advanceTimersByTime(350);
      });

      // Should render the BlurText with welcome message
      const blurText = screen.getByTestId('blur-text');
      expect(blurText).toBeInTheDocument();
      expect(blurText).toHaveTextContent('Welcome back');
    });

    it('should render plain text without BlurText when reduced motion is preferred', () => {
      mockPrefersReducedMotion.mockReturnValue(true);

      const onComplete = vi.fn();
      render(<LoginSuccessOverlay isVisible={true} onComplete={onComplete} />);

      // When reduced motion is on, plain text should be rendered instead of BlurText
      expect(screen.getByText('Welcome back')).toBeInTheDocument();
      // BlurText should not be used
      expect(screen.queryByTestId('blur-text')).toBeNull();
    });
  });
});
