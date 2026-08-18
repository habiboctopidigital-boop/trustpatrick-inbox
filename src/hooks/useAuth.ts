import { useCallback, useEffect, useState } from 'react';
import { api, AUTH_EVENT } from '../api/client';
import type { AuthUser } from '../types';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(true);

  const check = useCallback(async () => {
    setChecking(true);
    try {
      setUser(await api.me());
    } catch {
      setUser(null);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  // A 401 from anywhere in the app means the session expired/was cleared.
  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener(AUTH_EVENT, onUnauthorized);
    return () => window.removeEventListener(AUTH_EVENT, onUnauthorized);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await api.login(email, password);
    await check();
  }, [check]);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
    }
  }, []);

  return { user, checking, login, logout };
}
