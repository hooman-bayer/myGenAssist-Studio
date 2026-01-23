// src/hooks/useTokenRefresh.ts

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { getValidToken } from '@/lib/tokenManager';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function useTokenRefresh() {
  const token = useAuthStore((state) => state.token);

  // Convert to boolean for stable dependency
  const isAuthenticated = !!token;

  useEffect(() => {
    // Only run if authenticated
    if (!isAuthenticated) return;

    console.log('[useTokenRefresh] Starting background refresh interval');

    // Check immediately on mount to handle returning users with stale tokens
    getValidToken();

    const interval = setInterval(async () => {
      console.log('[useTokenRefresh] Checking token...');
      await getValidToken();
    }, REFRESH_INTERVAL_MS);

    return () => {
      console.log('[useTokenRefresh] Cleaning up interval');
      clearInterval(interval);
    };
  }, [isAuthenticated]); // Re-run only when auth state changes (logged in/out)
}
