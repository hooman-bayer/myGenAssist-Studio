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

/**
 * Login Page Unit Tests
 *
 * Tests for the Login page component including:
 * - Rendering tests
 * - SSO flow tests
 * - Success overlay integration tests
 * - Auth redirect tests
 * - Electron integration tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';

// Mock react-router-dom navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock useAuth hook
const mockLogin = vi.fn();
const mockUseAuth = vi.fn(() => ({
  login: mockLogin,
  isAuthenticated: false,
  isLoading: false,
  error: null,
}));
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
  default: () => mockUseAuth(),
}));

// Mock useAuthStore
const mockSetModelType = vi.fn();
const mockSetLocalProxyValue = vi.fn();
vi.mock('@/store/authStore', () => ({
  useAuthStore: () => ({
    setModelType: mockSetModelType,
    setLocalProxyValue: mockSetLocalProxyValue,
  }),
}));

// Mock LoginSuccessOverlay component
const mockOnComplete = vi.fn();
vi.mock('@/components/LoginSuccessOverlay', () => ({
  LoginSuccessOverlay: ({ isVisible, onComplete }: { isVisible: boolean; onComplete: () => void }) => {
    // Store onComplete reference for tests
    if (isVisible) {
      mockOnComplete.mockImplementation(onComplete);
    }
    return isVisible ? (
      <div data-testid="login-success-overlay">
        <span>Login Success Overlay</span>
        <button onClick={onComplete} data-testid="complete-overlay">
          Complete
        </button>
      </div>
    ) : null;
  },
}));

// Mock LoginBackground component
vi.mock('@/components/LoginBackground', () => ({
  LoginBackground: () => <div data-testid="login-background">Login Background</div>,
}));

// Mock WindowControls component
vi.mock('@/components/WindowControls', () => ({
  default: () => <div data-testid="window-controls">Window Controls</div>,
}));

// Mock PrivacyPolicyDialog component
vi.mock('@/components/Dialog/PrivacyPolicyDialog', () => ({
  PrivacyPolicyDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="privacy-dialog">Privacy Dialog</div> : null,
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'layout.login': 'Login',
        'layout.login-failed-please-try-again': 'Login failed. Please try again.',
        'layout.privacy-policy': 'Privacy Policy',
        'layout.welcome-back': 'Welcome back',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock assets
vi.mock('@/assets/mygenassist_logo.svg', () => ({
  default: 'mock-logo.svg',
}));

describe('Login Page', () => {
  // Setup window.electronAPI mock
  const mockGetPlatform = vi.fn(() => 'darwin');
  const mockCloseWindow = vi.fn();
  const mockIpcOn = vi.fn();
  const mockIpcOff = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mock implementations
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });

    // Setup window.electronAPI
    window.electronAPI = {
      getPlatform: mockGetPlatform,
      closeWindow: mockCloseWindow,
    };

    // Setup window.ipcRenderer
    window.ipcRenderer = {
      on: mockIpcOn,
      off: mockIpcOff,
    };

    // Mock import.meta.env
    vi.stubEnv('VITE_USE_LOCAL_PROXY', 'true');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  const renderLogin = () => {
    return render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
  };

  // We need to import the component after mocks are set up
  let Login: React.ComponentType;
  beforeEach(async () => {
    const module = await import('@/pages/Login');
    Login = module.default;
  });

  describe('Rendering Tests', () => {
    it('should show login button initially', async () => {
      renderLogin();

      const loginButton = screen.getByRole('button', { name: /sign in with bayer sso/i });
      expect(loginButton).toBeInTheDocument();
      expect(loginButton).not.toBeDisabled();
    });

    it('should show SSO login branding/content', async () => {
      renderLogin();

      // Check for myGenAssist Studio branding
      expect(screen.getByText('myGenAssist Studio')).toBeInTheDocument();

      // Check for login heading
      expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();

      // Check for login background component
      expect(screen.getByTestId('login-background')).toBeInTheDocument();

      // Check for window controls
      expect(screen.getByTestId('window-controls')).toBeInTheDocument();
    });
  });

  describe('SSO Flow Tests', () => {
    it('should call ssoLogin when login button is clicked', async () => {
      const user = userEvent.setup();
      renderLogin();

      const loginButton = screen.getByRole('button', { name: /sign in with bayer sso/i });
      await user.click(loginButton);

      expect(mockLogin).toHaveBeenCalledTimes(1);
    });

    it('should show loading state during auth (ssoLoading=true)', async () => {
      mockUseAuth.mockReturnValue({
        login: mockLogin,
        isAuthenticated: false,
        isLoading: true,
        error: null,
      });

      renderLogin();

      // Find the login button (the one with spinner) - it should be disabled
      const loginButton = screen.getByText('Signing in...').closest('button');
      expect(loginButton).toBeDisabled();
      expect(screen.getByText('Signing in...')).toBeInTheDocument();
    });

    it('should display error message on failure (ssoError set)', async () => {
      const errorMessage = 'Authentication failed';
      mockUseAuth.mockReturnValue({
        login: mockLogin,
        isAuthenticated: false,
        isLoading: false,
        error: new Error(errorMessage),
      });

      renderLogin();

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });
  });

  describe('Success Overlay Integration Tests', () => {
    it('should not show success overlay initially (showSuccessOverlay is false)', async () => {
      renderLogin();

      expect(screen.queryByTestId('login-success-overlay')).not.toBeInTheDocument();
    });

    it('should show success overlay when ssoAuthenticated becomes true', async () => {
      // Start with not authenticated
      const { rerender } = render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );

      expect(screen.queryByTestId('login-success-overlay')).not.toBeInTheDocument();

      // Update mock to return authenticated
      mockUseAuth.mockReturnValue({
        login: mockLogin,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      // Re-render with new auth state
      rerender(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('login-success-overlay')).toBeInTheDocument();
      });
    });

    it('should render LoginSuccessOverlay component when showSuccessOverlay=true', async () => {
      mockUseAuth.mockReturnValue({
        login: mockLogin,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      renderLogin();

      await waitFor(() => {
        expect(screen.getByTestId('login-success-overlay')).toBeInTheDocument();
        expect(screen.getByText('Login Success Overlay')).toBeInTheDocument();
      });
    });

    it('should navigate to "/" when handleSuccessComplete is called', async () => {
      mockUseAuth.mockReturnValue({
        login: mockLogin,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      renderLogin();

      await waitFor(() => {
        expect(screen.getByTestId('login-success-overlay')).toBeInTheDocument();
      });

      // Click the complete button in the overlay to trigger onComplete
      const completeButton = screen.getByTestId('complete-overlay');
      fireEvent.click(completeButton);

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('Auth Redirect Tests', () => {
    it('should set modelType to "custom" on successful auth', async () => {
      mockUseAuth.mockReturnValue({
        login: mockLogin,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      renderLogin();

      await waitFor(() => {
        expect(mockSetModelType).toHaveBeenCalledWith('custom');
      });
    });

    it('should set localProxyValue from environment on successful auth', async () => {
      mockUseAuth.mockReturnValue({
        login: mockLogin,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      renderLogin();

      await waitFor(() => {
        expect(mockSetLocalProxyValue).toHaveBeenCalled();
      });
    });
  });

  describe('Electron Integration Tests', () => {
    it('should handle before-close IPC event', async () => {
      renderLogin();

      // Verify that IPC event listener was registered
      expect(mockIpcOn).toHaveBeenCalledWith('before-close', expect.any(Function));

      // Get the callback function that was registered
      const beforeCloseCallback = mockIpcOn.mock.calls.find(
        (call) => call[0] === 'before-close'
      )?.[1];

      expect(beforeCloseCallback).toBeDefined();

      // Simulate the before-close event
      if (beforeCloseCallback) {
        beforeCloseCallback();
      }

      // Should close window directly without confirmation
      expect(mockCloseWindow).toHaveBeenCalledWith(true);
    });

    it('should clean up IPC listener on unmount', async () => {
      const { unmount } = renderLogin();

      // Unmount the component
      unmount();

      // Verify that the listener was removed
      expect(mockIpcOff).toHaveBeenCalledWith('before-close', expect.any(Function));
    });
  });
});
