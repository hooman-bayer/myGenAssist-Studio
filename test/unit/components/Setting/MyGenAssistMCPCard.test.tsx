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

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MyGenAssistMCPCard from '../../../../src/pages/Setting/components/MyGenAssistMCPCard';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'setting.mygenassist-mcp': 'myGenAssist MCP',
        'setting.connected': 'Connected',
        'setting.connected-to-bayer-ai-platform': 'Connected to Bayer AI platform',
        'setting.install': 'Install',
        'setting.installing': 'Installing...',
        'setting.uninstall': 'Uninstall',
        'setting.sso-token-managed-automatically': 'SSO token managed automatically',
        'setting.endpoint': 'Endpoint',
        'setting.configuration': 'Configuration',
      };
      return translations[key] || key;
    },
  }),
}));

describe('MyGenAssistMCPCard', () => {
  const defaultProps = {
    endpoint: 'https://dev.chat.int.bayer.com/api/v3/mcp',
    token: 'test-token-12345678-abcd-1234',
    isInstalled: false,
    isLoading: false,
    onInstall: vi.fn(),
    onUninstall: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('maskedToken computed value', () => {
    it('returns placeholder for null token', () => {
      render(
        <MyGenAssistMCPCard
          {...defaultProps}
          token={null}
        />
      );

      // Expand the configuration section to see the JSON
      const configButton = screen.getByText('Configuration');
      fireEvent.click(configButton);

      // The masked token should show the placeholder in the config JSON
      const configDisplay = document.querySelector('pre');
      expect(configDisplay?.textContent).toContain('Bearer ••••••••');
    });

    it('returns placeholder for short token (<= 16 chars)', () => {
      render(
        <MyGenAssistMCPCard
          {...defaultProps}
          token="shorttoken"
        />
      );

      const configButton = screen.getByText('Configuration');
      fireEvent.click(configButton);

      const configDisplay = document.querySelector('pre');
      expect(configDisplay?.textContent).toContain('Bearer ••••••••');
    });

    it('masks normal token correctly: shows first 8 chars + "..." + last 4 chars', () => {
      const token = 'abcdefghijklmnopqrstuvwxyz123456';
      render(
        <MyGenAssistMCPCard
          {...defaultProps}
          token={token}
        />
      );

      const configButton = screen.getByText('Configuration');
      fireEvent.click(configButton);

      const configDisplay = document.querySelector('pre');
      // First 8: "abcdefgh", last 4: "3456"
      expect(configDisplay?.textContent).toContain('Bearer abcdefgh...3456');
    });

    it('handles exactly 16 character token with placeholder', () => {
      const token = 'exactly16charstr';
      expect(token.length).toBe(16);

      render(
        <MyGenAssistMCPCard
          {...defaultProps}
          token={token}
        />
      );

      const configButton = screen.getByText('Configuration');
      fireEvent.click(configButton);

      const configDisplay = document.querySelector('pre');
      // Token is exactly 16 chars, should show placeholder
      expect(configDisplay?.textContent).toContain('Bearer ••••••••');
    });

    it('handles very long token (100+ chars)', () => {
      const token = 'a'.repeat(50) + 'b'.repeat(50) + 'wxyz';
      expect(token.length).toBe(104);

      render(
        <MyGenAssistMCPCard
          {...defaultProps}
          token={token}
        />
      );

      const configButton = screen.getByText('Configuration');
      fireEvent.click(configButton);

      const configDisplay = document.querySelector('pre');
      // First 8: "aaaaaaaa", last 4: "wxyz"
      expect(configDisplay?.textContent).toContain('Bearer aaaaaaaa...wxyz');
    });
  });

  describe('environment computed value', () => {
    it('returns "dev" for endpoint containing "dev.chat.int.bayer.com"', () => {
      render(
        <MyGenAssistMCPCard
          {...defaultProps}
          endpoint="https://dev.chat.int.bayer.com/api/v3/mcp"
        />
      );

      expect(screen.getByText(/Endpoint: dev/)).toBeInTheDocument();
    });

    it('returns "prod" for endpoint containing "chat.int.bayer.com" (not dev)', () => {
      render(
        <MyGenAssistMCPCard
          {...defaultProps}
          endpoint="https://chat.int.bayer.com/api/v3/mcp"
        />
      );

      expect(screen.getByText(/Endpoint: prod/)).toBeInTheDocument();
    });

    it('returns "custom" for other endpoints', () => {
      render(
        <MyGenAssistMCPCard
          {...defaultProps}
          endpoint="https://custom.api.example.com/mcp"
        />
      );

      expect(screen.getByText(/Endpoint: custom/)).toBeInTheDocument();
    });

    it('returns "unknown" for empty endpoint', () => {
      render(
        <MyGenAssistMCPCard
          {...defaultProps}
          endpoint=""
        />
      );

      expect(screen.getByText(/Endpoint: unknown/)).toBeInTheDocument();
    });
  });

  describe('configJson computed value', () => {
    it('includes mcpServers structure with mygenassist key', () => {
      render(
        <MyGenAssistMCPCard
          {...defaultProps}
        />
      );

      const configButton = screen.getByText('Configuration');
      fireEvent.click(configButton);

      const configDisplay = document.querySelector('pre');
      const configText = configDisplay?.textContent || '';

      expect(configText).toContain('"mcpServers"');
      expect(configText).toContain('"mygenassist"');
    });

    it('uses masked token in AUTH_HEADER env', () => {
      const token = 'my-secret-token-that-is-long-enough';
      render(
        <MyGenAssistMCPCard
          {...defaultProps}
          token={token}
        />
      );

      const configButton = screen.getByText('Configuration');
      fireEvent.click(configButton);

      const configDisplay = document.querySelector('pre');
      const configText = configDisplay?.textContent || '';

      expect(configText).toContain('"AUTH_HEADER"');
      // First 8: "my-secre", last 4: "ough"
      expect(configText).toContain('Bearer my-secre...ough');
    });

    it('uses provided endpoint in args', () => {
      const customEndpoint = 'https://custom.endpoint.com/api/mcp';
      render(
        <MyGenAssistMCPCard
          {...defaultProps}
          endpoint={customEndpoint}
        />
      );

      const configButton = screen.getByText('Configuration');
      fireEvent.click(configButton);

      const configDisplay = document.querySelector('pre');
      const configText = configDisplay?.textContent || '';

      expect(configText).toContain(customEndpoint);
    });

    it('falls back to default endpoint when empty', () => {
      render(
        <MyGenAssistMCPCard
          {...defaultProps}
          endpoint=""
        />
      );

      const configButton = screen.getByText('Configuration');
      fireEvent.click(configButton);

      const configDisplay = document.querySelector('pre');
      const configText = configDisplay?.textContent || '';

      expect(configText).toContain('https://dev.chat.int.bayer.com/api/v3/mcp');
    });
  });

  describe('Rendering', () => {
    it('shows install button when not installed (isInstalled=false)', () => {
      render(
        <MyGenAssistMCPCard
          {...defaultProps}
          isInstalled={false}
        />
      );

      expect(screen.getByText('Install')).toBeInTheDocument();
      expect(screen.queryByText('Connected')).not.toBeInTheDocument();
      expect(screen.queryByText('Uninstall')).not.toBeInTheDocument();
    });

    it('shows connected badge when installed (isInstalled=true)', () => {
      render(
        <MyGenAssistMCPCard
          {...defaultProps}
          isInstalled={true}
        />
      );

      expect(screen.getByText('Connected')).toBeInTheDocument();
      expect(screen.getByText('Uninstall')).toBeInTheDocument();
      expect(screen.queryByText('Install')).not.toBeInTheDocument();
    });

    it('expandable config section toggles correctly', () => {
      render(
        <MyGenAssistMCPCard
          {...defaultProps}
        />
      );

      // Initially, the JSON config should not be visible
      expect(document.querySelector('pre')).not.toBeInTheDocument();

      // Click to expand
      const configButton = screen.getByText('Configuration');
      fireEvent.click(configButton);

      // Now the JSON config should be visible
      expect(document.querySelector('pre')).toBeInTheDocument();

      // Click again to collapse
      fireEvent.click(configButton);

      // JSON config should be hidden again
      expect(document.querySelector('pre')).not.toBeInTheDocument();
    });

    it('disables install button when loading', () => {
      render(
        <MyGenAssistMCPCard
          {...defaultProps}
          isInstalled={false}
          isLoading={true}
        />
      );

      const installButton = screen.getByText('Installing...');
      expect(installButton).toBeDisabled();
    });

    it('disables install button when token is missing', () => {
      render(
        <MyGenAssistMCPCard
          {...defaultProps}
          isInstalled={false}
          token={null}
        />
      );

      const installButton = screen.getByText('Install');
      expect(installButton).toBeDisabled();
    });

    it('disables install button when endpoint is missing', () => {
      render(
        <MyGenAssistMCPCard
          {...defaultProps}
          isInstalled={false}
          endpoint=""
        />
      );

      const installButton = screen.getByText('Install');
      expect(installButton).toBeDisabled();
    });

    it('calls onInstall when install button is clicked', () => {
      const mockOnInstall = vi.fn();
      render(
        <MyGenAssistMCPCard
          {...defaultProps}
          isInstalled={false}
          onInstall={mockOnInstall}
        />
      );

      const installButton = screen.getByText('Install');
      fireEvent.click(installButton);

      expect(mockOnInstall).toHaveBeenCalledTimes(1);
    });

    it('calls onUninstall when uninstall button is clicked', () => {
      const mockOnUninstall = vi.fn();
      render(
        <MyGenAssistMCPCard
          {...defaultProps}
          isInstalled={true}
          onUninstall={mockOnUninstall}
        />
      );

      const uninstallButton = screen.getByText('Uninstall');
      fireEvent.click(uninstallButton);

      expect(mockOnUninstall).toHaveBeenCalledTimes(1);
    });
  });
});
