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

import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import myGenAssistLogo from '@/assets/mygenassist_logo.svg';
import { LoginBackground } from '@/components/LoginBackground';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import WindowControls from '@/components/WindowControls';
import { useAuth } from '@/hooks/useAuth';
import { PrivacyPolicyDialog } from '@/components/Dialog/PrivacyPolicyDialog';

export default function Login() {
  const { setModelType, setLocalProxyValue } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Bayer SSO auth hook
  const {
    login: ssoLogin,
    isAuthenticated: ssoAuthenticated,
    isLoading: ssoLoading,
    error: ssoError,
  } = useAuth();
  const [ssoErrorMessage, setSsoErrorMessage] = useState<string>('');
  const titlebarRef = useRef<HTMLDivElement>(null);
  const [platform, setPlatform] = useState<string>('');
  const [isPrivacyPolicyOpen, setIsPrivacyPolicyOpen] = useState(false);

  useEffect(() => {
    const p = window.electronAPI.getPlatform();
    setPlatform(p);

    if (platform === 'darwin') {
      titlebarRef.current?.classList.add('mac');
    }
  }, [platform]);

  // Handle before-close event for login page
  useEffect(() => {
    const handleBeforeClose = () => {
      // On login page, always close directly without confirmation
      window.electronAPI.closeWindow(true);
    };

    window.ipcRenderer?.on('before-close', handleBeforeClose);

    return () => {
      window.ipcRenderer?.off('before-close', handleBeforeClose);
    };
  }, []);

  // Redirect to main app on successful SSO authentication
  useEffect(() => {
    if (ssoAuthenticated) {
      setModelType('custom');
      const localProxyValue = import.meta.env.VITE_USE_LOCAL_PROXY || null;
      setLocalProxyValue(localProxyValue);
      navigate('/');
    }
  }, [ssoAuthenticated, navigate, setModelType, setLocalProxyValue]);

  // Update SSO error message when error changes
  useEffect(() => {
    if (ssoError) {
      setSsoErrorMessage(ssoError.message || t('layout.login-failed-please-try-again'));
    }
  }, [ssoError, t]);

  // Handle Bayer SSO login
  const handleSsoLogin = async () => {
    try {
      setSsoErrorMessage('');
      await ssoLogin();
    } catch (error: any) {
      console.error('SSO Login failed:', error);
      setSsoErrorMessage(
        error?.message || t('layout.login-failed-please-try-again')
      );
    }
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Titlebar with drag region and window controls */}
      <div
        className="absolute top-0 left-0 right-0 flex !h-9 items-center justify-between pl-2 py-1 z-50"
        id="login-titlebar"
        ref={titlebarRef}
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        {/* Left spacer for macOS window controls */}
        <div
          className={`${
            platform === 'darwin' ? 'w-[70px]' : 'w-0'
          }`}
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        />

        {/* Center drag region */}
        <div
          className="h-full flex-1 flex items-center"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
          <div className="flex-1 h-10"></div>
        </div>

        {/* Right window controls */}
        <div
          style={
            {
              WebkitAppRegion: 'no-drag',
              pointerEvents: 'auto',
            } as React.CSSProperties
          }
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <WindowControls />
        </div>
      </div>

      {/* Main content - split pane layout */}
      <div className={`p-2 flex items-center justify-center gap-2 h-full`}>
        {/* Left pane - animated background */}
        <div className="w-1/2 h-full rounded-3xl overflow-hidden">
          <LoginBackground />
        </div>
        {/* Right pane - login form */}
        <div className="w-1/2 h-full flex flex-col items-center justify-center pt-11">
          <div className="flex-1 flex flex-col w-80 items-center justify-center">
            {/* Logo and Branding */}
            <div className="flex flex-col items-center mb-10">
              <img
                src={myGenAssistLogo}
                alt="myGenAssist"
                className="h-12 w-auto mb-3"
              />
              <span className="text-lg font-medium text-text-secondary tracking-wide">
                myGenAssist Studio
              </span>
            </div>

            {/* Welcome Heading */}
            <div className="flex self-stretch items-center justify-center mb-8">
              <h1 className="text-text-heading text-2xl font-semibold text-center">
                {t('layout.login')}
              </h1>
            </div>
            {/* Bayer SSO Login - Only Option */}
            <div className="w-full flex flex-col items-center">
              {ssoErrorMessage && (
                <p className="text-text-cuation text-label-md mb-4 text-center">
                  {ssoErrorMessage}
                </p>
              )}
              <Button
                variant="primary"
                size="lg"
                onClick={handleSsoLogin}
                className="w-full rounded-[24px] mb-4 transition-all duration-300 ease-in-out text-[#F5F5F5] text-center font-inter text-[15px] font-bold leading-[22px] justify-center bg-[#10857F] hover:bg-[#0d6b66]"
                disabled={ssoLoading}
              >
                {ssoLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5 mr-2"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
                        fill="currentColor"
                      />
                    </svg>
                    <span>Sign in with Bayer SSO</span>
                  </>
                )}
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setIsPrivacyPolicyOpen(true)}
          >
            {t('layout.privacy-policy')}
          </Button>
          <PrivacyPolicyDialog
            open={isPrivacyPolicyOpen}
            onOpenChange={setIsPrivacyPolicyOpen}
          />
        </div>
      </div>
    </div>
  );
}
