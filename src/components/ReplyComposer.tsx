import { useState, type FormEvent } from 'react';
import { api } from '../api/client';
import type { Contact } from '../types';
import { Spinner } from './Spinner';
import { useToast } from './Toast';

interface Props {
  contact: Contact;
  conversationId: string;
  onSent: () => void;
}

export function ReplyComposer({ contact, conversationId, onSent }: Props) {
  const toast = useToast();
  const [subject, setSubject] = useState('');
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

    if (!contact.email) {
      setError('This contact has no email address on file.');
      return;
    }

    setSending(true);
    try {
      await api.sendReply(conversationId, {
        contactId: contact.id,
        subject: subject.trim() || undefined,
        html: `<p>${escapeHtml(body.trim()).replace(/\n/g, '</p><p>')}</p>`,
        emailTo: contact.email,
      });
      setSubject('');
      setBody('');
      toast.show('Reply sent.', 'success');
      onSent();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reply. Try again.');
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
        placeholder={`Reply to ${contact.name}…`}
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
        <span className="composer-to">To: {contact.email || 'no email on file'}</span>
        <button type="submit" className="btn btn-primary" disabled={sending}>
          {sending ? (
            <>
              <Spinner /> Sending…
            </>
          ) : (
            'Send reply'
          )}
        </button>
      </div>
    </form>
  );
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
