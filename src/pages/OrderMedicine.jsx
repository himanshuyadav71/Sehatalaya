import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../lib/i18n.jsx';
import { useSettings } from '../lib/settings.jsx';
import { supabase } from '../lib/supabase.js';
import { telHref } from '../lib/utils.js';

const RX_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' };
const RX_MAX = 5 * 1024 * 1024;
const ERROR_KEYS = {
  DELIVERY_CLOSED: 'order.err.closed',
  BAD_NAME: 'order.err.name',
  BAD_PHONE: 'order.err.phone',
  BAD_ADDRESS: 'order.err.address',
  NO_ITEMS: 'order.err.items',
  TOO_LONG: 'order.err.long',
  TOO_MANY: 'order.err.many',
};

export function rememberOrder(code, phone) {
  try {
    localStorage.setItem('sehatalay.lastOrder', JSON.stringify({ code, phone }));
  } catch {
    /* storage unavailable */
  }
}

export default function OrderMedicine() {
  const { t } = useLang();
  const { settings } = useSettings();
  const [form, setForm] = useState({ name: '', phone: '', address: '', area: '', items: '', note: '' });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [placed, setPlaced] = useState(null);

  useEffect(() => {
    document.title = `${t('order.title')} — ${t('brand')}`;
  }, [t]);

  const shopName = settings.delivery_shop_name || '';
  const shopPhone = String(settings.delivery_shop_phone || '');
  const shopAddress = settings.delivery_shop_address || '';
  const open = settings.delivery_enabled === true;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const phone = form.phone.replace(/\D/g, '').slice(-10);
    if (form.name.trim().length < 2) return setError(t('order.err.name'));
    if (!/^[6-9]\d{9}$/.test(phone)) return setError(t('order.err.phone'));
    if (form.address.trim().length < 8) return setError(t('order.err.address'));
    if (!form.items.trim() && !file) return setError(t('order.err.items'));
    if (file && (!RX_TYPES[file.type] || file.size > RX_MAX)) return setError(t('order.err.file'));

    setBusy(true);
    let path = null;
    if (file) {
      path = `${crypto.randomUUID()}.${RX_TYPES[file.type]}`;
      const { error: upErr } = await supabase.storage
        .from('prescriptions')
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) {
        setBusy(false);
        return setError(t('order.err.upload'));
      }
    }
    const { data, error: rpcErr } = await supabase.rpc('place_order', {
      p_name: form.name,
      p_phone: phone,
      p_address: form.address,
      p_area: form.area,
      p_items: form.items,
      p_note: form.note,
      p_prescription_path: path,
    });
    setBusy(false);
    if (rpcErr) {
      const key = Object.keys(ERROR_KEYS).find((k) => rpcErr.message.includes(k));
      return setError(t(key ? ERROR_KEYS[key] : 'order.err.generic'));
    }
    rememberOrder(data, phone);
    setPlaced({ code: data, phone });
    window.scrollTo(0, 0);
    return undefined;
  };

  if (placed) {
    const wa = `https://wa.me/91${shopPhone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(
      `Sehatalay order ${placed.code} - ${form.name}, ${form.address}. ${form.items}`.slice(0, 600),
    )}`;
    return (
      <div className="container page narrow-wide">
        <div className="card order-done">
          <h1 className="page-title">{t('order.done.title')}</h1>
          <p>{t('order.done.code')}</p>
          <p className="order-code">{placed.code}</p>
          <p className="muted">{t('order.done.next', { shop: shopName })}</p>
          <div className="form-actions center">
            <Link className="btn btn-primary" to={`/track?code=${placed.code}`}>
              {t('order.done.track')}
            </Link>
            {shopPhone ? (
              <a className="btn btn-outline" href={wa} target="_blank" rel="noopener noreferrer">
                {t('order.done.whatsapp')}
              </a>
            ) : null}
          </div>
          <p className="muted small">{t('order.done.keep')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container page narrow-wide">
      <h1 className="page-title">{t('order.title')}</h1>
      <p className="muted">
        {t('order.intro', { shop: shopName, address: shopAddress })}{' '}
        {shopPhone ? (
          <>
            {t('order.shopPhone')}: <a href={telHref(shopPhone)}>{shopPhone}</a>
          </>
        ) : null}
      </p>

      {!open ? (
        <div className="notice notice-warn" role="alert">
          {t('order.err.closed')}
        </div>
      ) : null}

      <form className="card order-form" onSubmit={submit} noValidate>
        <div className="form-grid">
          <label className="field">
            <span>{t('order.name')} *</span>
            <input value={form.name} onChange={set('name')} maxLength={80} autoComplete="name" />
          </label>
          <label className="field">
            <span>{t('order.phone')} *</span>
            <input
              value={form.phone}
              onChange={set('phone')}
              inputMode="numeric"
              maxLength={14}
              autoComplete="tel"
              placeholder="98XXXXXXXX"
            />
          </label>
          <label className="field span-2">
            <span>{t('order.address')} *</span>
            <textarea value={form.address} onChange={set('address')} rows={2} maxLength={300} />
          </label>
          <label className="field span-2">
            <span>{t('order.area')}</span>
            <input value={form.area} onChange={set('area')} maxLength={80} />
          </label>
          <label className="field span-2">
            <span>{t('order.items')}</span>
            <textarea
              value={form.items}
              onChange={set('items')}
              rows={4}
              maxLength={2000}
              placeholder={t('order.itemsHint')}
            />
          </label>
          <label className="field span-2">
            <span>{t('order.rx')}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
          <label className="field span-2">
            <span>{t('order.note')}</span>
            <input value={form.note} onChange={set('note')} maxLength={500} />
          </label>
        </div>

        <div className="notice notice-info small">
          <ul>
            <li>{t('order.rule.rx')}</li>
            <li>{t('order.rule.price')}</li>
            <li>{t('order.rule.pay')}</li>
            <li>{t('order.rule.emergency')}</li>
          </ul>
        </div>

        {error ? (
          <div className="notice notice-error" role="alert">
            {error}
          </div>
        ) : null}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={busy || !open || !supabase}>
            {busy ? t('order.sending') : t('order.submit')}
          </button>
          <Link className="btn btn-ghost" to="/track">
            {t('nav.track')}
          </Link>
        </div>
      </form>
    </div>
  );
}
