import { useEffect, useState } from 'react';
import { DEFAULT_SETTINGS, useSettings } from '../../lib/settings.jsx';
import { supabase } from '../../lib/supabase.js';

const ADSENSE_PATTERN = /^ca-pub-\d{10,20}$/;

export default function Settings() {
  const { settings, reload } = useSettings();
  const [form, setForm] = useState(DEFAULT_SETTINGS);
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ ...DEFAULT_SETTINGS, ...settings });
  }, [settings]);

  const set = (key) => (e) =>
    setForm((f) => ({
      ...f,
      [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    }));

  const save = async (e) => {
    e.preventDefault();
    setMessage(null);

    const client = String(form.adsense_client || '').trim();
    if (form.adsense_enabled && !ADSENSE_PATTERN.test(client)) {
      setMessage({
        kind: 'error',
        text: 'To enable AdSense, enter your publisher ID in the form ca-pub-0000000000000000.',
      });
      return;
    }
    const email = String(form.contact_email || '').trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage({ kind: 'error', text: 'Enter a valid public contact email, or leave it empty.' });
      return;
    }

    setSaving(true);
    const rows = [
      { key: 'announcement_en', value: String(form.announcement_en || '').trim() },
      { key: 'announcement_hi', value: String(form.announcement_hi || '').trim() },
      { key: 'contact_email', value: email },
      { key: 'adsense_enabled', value: form.adsense_enabled === true },
      { key: 'adsense_client', value: client },
    ];
    const { error } = await supabase.from('site_settings').upsert(rows, { onConflict: 'key' });
    setSaving(false);
    if (error) {
      setMessage({ kind: 'error', text: `Could not save settings: ${error.message}` });
      return;
    }
    await reload();
    setMessage({ kind: 'ok', text: 'Settings saved.' });
  };

  return (
    <form className="admin-form" onSubmit={save}>
      <h1 className="page-title">Website settings</h1>

      {message ? (
        <div className={`notice ${message.kind === 'ok' ? 'notice-ok' : 'notice-error'}`} role="status">
          {message.text}
        </div>
      ) : null}

      <fieldset className="card">
        <legend>Announcement bar</legend>
        <p className="muted small">Shown at the top of every page. Leave empty to hide it.</p>
        <div className="form-grid">
          <label className="field span-2">
            <span>Announcement (English)</span>
            <input value={form.announcement_en} onChange={set('announcement_en')} maxLength={200} />
          </label>
          <label className="field span-2">
            <span>Announcement (Hindi)</span>
            <input
              lang="hi"
              value={form.announcement_hi}
              onChange={set('announcement_hi')}
              maxLength={200}
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="card">
        <legend>Public contact</legend>
        <p className="muted small">
          Shown on the About page so providers can request additions, corrections or removal. This
          address is visible to everyone, so use one you are happy to publish.
        </p>
        <label className="field">
          <span>Public contact email</span>
          <input type="email" value={form.contact_email} onChange={set('contact_email')} />
        </label>
      </fieldset>

      <fieldset className="card">
        <legend>Google AdSense</legend>
        <p className="muted small">
          Keep this off until Google has approved the site. While it is off, no ad code is loaded
          and no ad space is shown. After approval, also rename <code>public/ads.txt.example</code>{' '}
          to <code>ads.txt</code> with your publisher ID and redeploy.
        </p>
        <label className="field">
          <span>AdSense publisher ID</span>
          <input
            value={form.adsense_client}
            onChange={set('adsense_client')}
            placeholder="ca-pub-0000000000000000"
            maxLength={30}
          />
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={form.adsense_enabled === true}
            onChange={set('adsense_enabled')}
          />
          <span>Enable AdSense ads on the public site</span>
        </label>
      </fieldset>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </form>
  );
}
