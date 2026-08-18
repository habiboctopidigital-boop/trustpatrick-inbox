import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { ConversationMessage } from '../types';

export function useThread(contactId: string | null) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!contactId) return;
    setLoading(true);
    setError(null);
    try {
      const { conversations } = await api.getConversations(contactId);
      const conv = conversations[0];
      if (!conv?.id) throw new Error('No conversation found for this contact.');
      setConversationId(conv.id);
      const { messages } = await api.getMessages(conv.id);
      setMessages(messages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load this conversation.');
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    setMessages([]);
    setConversationId(null);
    reload();
  }, [reload]);

  return { conversationId, messages, loading, error, reload };
}
