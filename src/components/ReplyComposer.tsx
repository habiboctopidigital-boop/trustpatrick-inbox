import { useState, type FormEvent } from 'react';
import { api } from '../api/client';
import type { Contact } from '../types';
import { Spinner } from './Spinner';
import { useToast } from './Toast';

interface Props {
  contact: Contact;
  conversationId: string;
  /** Resolved phone — the full contact record when loaded, else the list value. */
  phone: string | null;
  onSent: () => void;
}

export function ReplyComposer({ contact, conversationId, phone, onSent }: Props) {
  const toast = useToast();
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [bodyError, setBodyError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!body.trim()) {
      setBodyError('Write a reply before sending.');
      return;
    }
    setBodyError(null);

    if (!phone) {
      setError('This contact has no phone number on file.');
      return;
    }

    setSending(true);
    try {
      await api.sendReply(conversationId, {
        contactId: contact.id,
        message: body.trim(),
        toNumber: phone,
      });
      setBody('');
      toast.show('SMS sent.', 'success');
      onSent();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send SMS. Try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <form className="composer" onSubmit={handleSubmit}>
      {error && (
        <div className="banner banner-error" role="alert">
          {error}
        </div>
      )}

      <textarea
        className={bodyError ? 'input textarea input-error' : 'input textarea'}
        placeholder={`Text ${contact.name}…`}
        value={body}
        onChange={(e) => {
          setBody(e.target.value);
          if (bodyError) setBodyError(null);
        }}
        disabled={sending}
        rows={3}
      />
      {bodyError && <span className="field-error">{bodyError}</span>}
      <div className="composer-actions">
        <span className="composer-to">To: {phone || 'no phone number on file'}</span>
        <button type="submit" className="btn btn-primary" disabled={sending || !phone}>
          {sending ? (
            <>
              <Spinner /> Sending…
            </>
          ) : (
            'Send SMS'
          )}
        </button>
      </div>
    </form>
  );
}
