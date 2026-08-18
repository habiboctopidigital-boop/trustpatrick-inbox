import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Contact } from '../types';

export function useContacts(enabled: boolean) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const { contacts } = await api.getContacts();
      setContacts(contacts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contacts.');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { contacts, loading, error, reload };
}
