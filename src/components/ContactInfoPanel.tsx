import type { ReactNode } from 'react';
import type { Contact, ContactCustomField, ContactDetail } from '../types';
import { avatarColor, initials } from '../utils/avatarColor';
import { Spinner } from './Spinner';

interface Props {
  contact: Contact;
  detail: ContactDetail | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onClose: () => void;
}

export function ContactInfoPanel({ contact, detail, loading, error, onRetry, onClose }: Props) {
  const name = detail?.name || contact.name;

  return (
    <>
      <div className="info-backdrop" onClick={onClose} />
      <aside className="info-panel" role="dialog" aria-label={`Contact info for ${name}`}>
        <header className="info-panel-header">
          <h2>Contact info</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close contact info">
            ✕
          </button>
        </header>

        <div className="info-panel-body">
          <div className="info-identity">
            <span className="avatar avatar-lg" style={{ background: avatarColor(name) }} aria-hidden="true">
              {initials(name)}
            </span>
            <span className="info-identity-name">{name}</span>
            {detail?.companyName && <span className="info-identity-sub">{detail.companyName}</span>}
          </div>

          {loading && (
            <div className="info-loading" aria-busy="true">
              <Spinner /> Loading details…
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

          {!loading && !error && detail && (
            <>
              <Section title="Contact">
                <Row label="Phone" value={detail.phone} mono />
                <Row label="Email" value={detail.email} />
                <Row label="Website" value={detail.website} />
                <Row label="Do not disturb" value={detail.dnd ? 'Yes' : 'No'} />
              </Section>

              <Section title="Location">
                <Row label="Address" value={detail.address} />
                <Row label="City" value={detail.city} />
                <Row label="State" value={detail.state} />
                <Row label="Postal code" value={detail.postalCode} />
                <Row label="Country" value={detail.country} />
                <Row label="Timezone" value={detail.timezone} />
              </Section>

              <Section title="Record">
                <Row label="Source" value={detail.source} />
                <Row label="Type" value={detail.type} />
                <Row label="Assigned to" value={detail.assignedTo} />
                <Row label="Date of birth" value={formatDate(detail.dateOfBirth)} />
                <Row label="Created" value={formatDate(detail.dateAdded)} />
                <Row label="Last updated" value={formatDate(detail.dateUpdated ?? null)} />
                <Row label="Contact ID" value={detail.id} mono />
              </Section>

              {detail.tags.length > 0 && (
                <Section title="Tags">
                  <div className="info-tags">
                    {detail.tags.map((t) => (
                      <span className="info-tag" key={t}>
                        {t}
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              {detail.customFields.length > 0 && (
                <Section title="Custom fields">
                  {detail.customFields.map((f, i) => (
                    <Row
                      key={f.id || f.key || i}
                      label={f.key || f.id || `Field ${i + 1}`}
                      value={renderCustomValue(f)}
                    />
                  ))}
                </Section>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="info-section">
      <h3 className="info-section-title">{title}</h3>
      <dl className="info-rows">{children}</dl>
    </section>
  );
}

function Row({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
  return (
    <div className="info-row">
      <dt>{label}</dt>
      <dd className={mono ? 'info-value info-value-mono' : 'info-value'}>
        {value || <span className="info-empty">—</span>}
      </dd>
    </div>
  );
}

/** Custom field values can be strings, numbers, arrays or objects. */
function renderCustomValue(field: ContactCustomField): string | null {
  const v = field.value ?? field.field_value ?? null;
  if (v === null || v === undefined || v === '') return null;
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}
