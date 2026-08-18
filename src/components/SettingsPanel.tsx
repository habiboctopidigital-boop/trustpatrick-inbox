import { useState, type FormEvent } from 'react';
import type { SettingsView } from '../types';
import { Spinner } from './Spinner';
import { useToast } from './Toast';

interface Props {
  settings: SettingsView | null;
  onClose: () => void;
  onSave: (locationId: string, token: string) => Promise<SettingsView>;
  onDisconnect: () => Promise<SettingsView>;
  dismissible: boolean;
}

export function SettingsPanel({ settings, onClose, onSave, onDisconnect, dismissible }: Props) {
  const toast = useToast();
  const [locationId, setLocationId] = useState(settings?.locationId ?? '');
  const [token, setToken] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ locationId?: string; token?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  const readOnly = Boolean(settings?.managedByEnv);

  const validate = () => {
    const errs: typeof fieldErrors = {};
    if (!locationId.trim()) errs.locationId = 'Location ID is required.';
    if (!token.trim() && !settings?.hasToken) errs.token = 'Private Integration Token is required.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSave(locationId.trim(), token.trim() || '');
      toast.show('Connected to GoHighLevel.', 'success');
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not connect. Check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await onDisconnect();
      toast.show('Disconnected from GoHighLevel.', 'info');
      setToken('');
      setLocationId('');
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Failed to disconnect.', 'error');
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => dismissible && onClose()}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <div className="modal-header">
          <h2 id="settings-title">Connect GoHighLevel</h2>
          {dismissible && (
            <button className="icon-btn" onClick={onClose} aria-label="Close">
              ✕
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="modal-body" noValidate>
          {readOnly && (
            <div className="banner banner-info" role="status">
              Managed via environment variables (<code>GHL_LOCATION_ID</code> / <code>GHL_PRIVATE_TOKEN</code>) on this
              deployment. Update them in your hosting provider's project settings to change the connection.
            </div>
          )}
          {formError && (
            <div className="banner banner-error" role="alert">
              {formError}
            </div>
          )}

          <label className="field">
            <span className="field-label">GHL Location ID *</span>
            <input
              type="text"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              placeholder="e.g. 6FMoTZ73b44WscvLbueR"
              className={fieldErrors.locationId ? 'input input-error' : 'input'}
              disabled={submitting || readOnly}
              autoComplete="off"
            />
            {fieldErrors.locationId && <span className="field-error">{fieldErrors.locationId}</span>}
          </label>

          <label className="field">
            <span className="field-label">Private Integration Token *</span>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder={settings?.hasToken ? `Currently set: ${settings.tokenPreview}` : 'pit-...'}
              className={fieldErrors.token ? 'input input-error' : 'input'}
              disabled={submitting || readOnly}
              autoComplete="off"
            />
            {fieldErrors.token && <span className="field-error">{fieldErrors.token}</span>}
            {settings?.hasToken && !fieldErrors.token && !readOnly && (
              <span className="field-hint">Leave blank to keep the current token.</span>
            )}
          </label>

          {!readOnly && (
            <div className="modal-actions">
              {settings?.configured && (
                <button
                  type="button"
                  className="btn btn-ghost btn-danger"
                  onClick={handleDisconnect}
                  disabled={disconnecting || submitting}
                >
                  {disconnecting ? <Spinner /> : 'Disconnect'}
                </button>
              )}
              <div className="modal-actions-right">
                {dismissible && (
                  <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
                    Cancel
                  </button>
                )}
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Spinner /> Connecting…
                    </>
                  ) : (
                    'Connect'
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
