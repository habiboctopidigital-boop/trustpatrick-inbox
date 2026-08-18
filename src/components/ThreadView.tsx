import type { Contact, ConversationMessage } from '../types';
import { avatarColor, initials } from '../utils/avatarColor';
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
  if (!contact) {
    return (
      <div className="thread-empty">
        <span className="pane-message-icon">💬</span>
        <p>Select a conversation to read and reply.</p>
      </div>
    );
  }

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
          <span className="thread-header-sub">{contact.email || contact.phone || ''}</span>
        </div>
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
            <p>No messages in this conversation yet.</p>
          </div>
        )}

        {!loading &&
          !error &&
          messages.map((m) => (
            <div key={m.id} className={`bubble bubble-${m.direction === 'outbound' ? 'out' : 'in'}`}>
              {m.subject && <div className="bubble-subject">{m.subject}</div>}
              <div className="bubble-body" dangerouslySetInnerHTML={{ __html: m.html }} />
              {m.dateAdded && <div className="bubble-time">{formatDate(m.dateAdded)}</div>}
            </div>
          ))}
      </div>

      {!loading && !error && conversationId && (
        <ReplyComposer contact={contact} conversationId={conversationId} onSent={onRetry} />
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
