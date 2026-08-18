import { useState } from 'react';
import type { Contact, ConversationMessage } from '../types';
import { avatarColor, initials } from '../utils/avatarColor';
import { useContactDetail } from '../hooks/useContactDetail';
import { ContactInfoPanel } from './ContactInfoPanel';
import { ReplyComposer } from './ReplyComposer';

interface Props {
  contact: Contact | null;
  conversationId: string | null;
  messages: ConversationMessage[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onBack: () => void;
}

export function ThreadView({ contact, conversationId, messages, loading, error, onRetry, onBack }: Props) {
  const [infoOpen, setInfoOpen] = useState(false);
  const { detail, loading: detailLoading, error: detailError, reload: reloadDetail } = useContactDetail(
    contact?.id ?? null
  );

  if (!contact) {
    return (
      <div className="thread-empty">
        <span className="pane-message-icon">💬</span>
        <p>Select a conversation to read and reply.</p>
      </div>
    );
  }

  // The contact list comes from GHL's search endpoint, which often omits the
  // phone — prefer the full record once it arrives.
  const phone = detail?.phone || contact.phone || null;
  const email = detail?.email || contact.email || null;

  return (
    <div className="thread">
      <div className="thread-header">
        <button className="icon-btn thread-back" onClick={onBack} aria-label="Back to contacts">
          ←
        </button>
        <span className="avatar" style={{ background: avatarColor(contact.name) }} aria-hidden="true">
          {initials(contact.name)}
        </span>
        <div className="thread-header-body">
          <span className="thread-header-name">{contact.name}</span>
          {email && <span className="thread-header-sub">{email}</span>}
          <span className="thread-header-phone">
            {phone || (detailLoading ? 'Loading number…' : 'No phone number')}
          </span>
        </div>
        <button className="btn btn-secondary thread-info-btn" onClick={() => setInfoOpen(true)}>
          View info
        </button>
      </div>

      <div className="thread-messages">
        {loading && (
          <div aria-busy="true" className="thread-skeletons">
            {Array.from({ length: 3 }).map((_, i) => (
              <div className="skeleton skeleton-bubble" key={i} style={{ alignSelf: i % 2 ? 'flex-end' : 'flex-start' }} />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="pane-message">
            <span className="pane-message-icon">⚠️</span>
            <p>{error}</p>
            <button className="btn btn-secondary" onClick={onRetry}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && messages.length === 0 && (
          <div className="pane-message">
            <span className="pane-message-icon">📨</span>
            <p>No SMS messages in this conversation yet.</p>
          </div>
        )}

        {!loading &&
          !error &&
          [...messages]
            .sort((a, b) => {
              const da = a.dateAdded ? new Date(a.dateAdded).getTime() : 0;
              const db = b.dateAdded ? new Date(b.dateAdded).getTime() : 0;
              return da - db;
            })
            .map((m) => (
              <div key={m.id} className={`bubble bubble-${m.direction === 'outbound' ? 'out' : 'in'}`}>
                <div className="bubble-body bubble-body-text">{m.text}</div>
                {m.dateAdded && <div className="bubble-time">{formatDate(m.dateAdded)}</div>}
              </div>
            ))}
      </div>

      {!loading && !error && conversationId && (
        <ReplyComposer contact={contact} conversationId={conversationId} phone={phone} onSent={onRetry} />
      )}

      {infoOpen && (
        <ContactInfoPanel
          contact={contact}
          detail={detail}
          loading={detailLoading}
          error={detailError}
          onRetry={reloadDetail}
          onClose={() => setInfoOpen(false)}
        />
      )}
    </div>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}
