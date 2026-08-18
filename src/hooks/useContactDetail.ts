import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { ContactDetail } from '../types';

/**
 * Full contact record for the thread header and the info panel. The contact
 * list comes from GHL's search endpoint, which trims fields (phone is often
 * absent) — this fills in the rest.
 */
export function useContactDetail(contactId: string | null) {
  const [detail, setDetail] = useState<ContactDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!contactId) return;
    setLoading(true);
    setError(null);
    try {
      const { contact } = await api.getContact(contactId);
      setDetail(contact);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contact details.');
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    setDetail(null);
    setError(null);
    reload();
  }, [reload]);

  return { detail, loading, error, reload };
}
