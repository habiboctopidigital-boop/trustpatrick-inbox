import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { SettingsView } from '../types';

export function useSettings() {
  const [settings, setSettings] = useState<SettingsView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSettings(await api.getSettings());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const save = useCallback(async (locationId: string, token: string) => {
    const next = await api.saveSettings(locationId, token);
    setSettings(next);
    return next;
  }, []);

  const disconnect = useCallback(async () => {
    const next = await api.clearSettings();
    setSettings(next);
    return next;
  }, []);

  return { settings, loading, error, reload, save, disconnect };
}
