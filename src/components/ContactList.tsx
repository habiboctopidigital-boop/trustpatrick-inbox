import type { Contact } from '../types';
import { avatarColor, initials } from '../utils/avatarColor';

interface Props {
  contacts: Contact[];
  loading: boolean;
  error: string | null;
  selectedId: string | null;
  onSelect: (contact: Contact) => void;
  onRetry: () => void;
}

export function ContactList({ contacts, loading, error, selectedId, onSelect, onRetry }: Props) {
  if (loading) {
    return (
      <div className="contact-list" aria-busy="true">
        {Array.from({ length: 6 }).map((_, i) => (
          <div className="contact-skeleton" key={i}>
            <div className="skeleton skeleton-avatar" />
            <div className="skeleton-lines">
              <div className="skeleton skeleton-line" style={{ width: '60%' }} />
              <div className="skeleton skeleton-line" style={{ width: '85%' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="pane-message">
        <span className="pane-message-icon">⚠️</span>
        <p>{error}</p>
        <button className="btn btn-secondary" onClick={onRetry}>
          Retry
        </button>
      </div>
    );
  }

  if (!contacts.length) {
    return (
      <div className="pane-message">
        <span className="pane-message-icon">📭</span>
        <p>
          No contacts tagged <code>positive-replied</code> yet.
        </p>
        <button className="btn btn-secondary" onClick={onRetry}>
          Refresh
        </button>
      </div>
    );
  }

  return (
    <ul className="contact-list" role="list">
      {contacts.map((c) => (
        <li key={c.id}>
          <button
            className={`contact-item${selectedId === c.id ? ' contact-item-active' : ''}`}
            onClick={() => onSelect(c)}
          >
            <span className="avatar" style={{ background: avatarColor(c.name) }} aria-hidden="true">
              {initials(c.name)}
            </span>
            <span className="contact-item-body">
              <span className="contact-item-name">{c.name}</span>
              <span className="contact-item-sub">{c.email || c.phone || 'No contact info'}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
