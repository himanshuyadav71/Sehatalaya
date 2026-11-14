import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLang } from '../lib/i18n.jsx';
import { useSettings } from '../lib/settings.jsx';
import { supabase } from '../lib/supabase.js';
import { telHref } from '../lib/utils.js';

const STEPS = ['placed', 'confirmed', 'out_for_delivery', 'delivered'];
const STEP_TIME = {
  placed: 'created_at',
  confirmed: 'confirmed_at',
  out_for_delivery: 'dispatched_at',
  delivered: 'delivered_at',
};

function saved() {
  try {
    return JSON.parse(localStorage.getItem('sehatalay.lastOrder') || 'null');
  } catch {
    return null;
  }
}

export default function TrackOrder() {
  const { t, lang } = useLang();
  const { settings } = useSettings();
  const [params] = useSearchParams();
  const last = saved();
  const initialCode = (params.get('code') || last?.code || '').toUpperCase();
  const [code, setCode] = useState(initialCode);
  const [phone, setPhone] = useState(last && last.code === initialCode ? last.phone : '');
  const [order, setOrder] = useState(null);
  const [state, setState] = useState('idle'); // idle | loading | notfound | error
  const [query, setQuery] = useState(null);

  useEffect(() => {
    document.title = `${t('track.title')} — ${t('brand')}`;
  }, [t]);

  const load = useCallback(async (q, quiet) => {
    if (!supabase || !q) return;
    if (!quiet) setState('loading');
    const { data, error } = await supabase.rpc('track_order', { p_code: q.code, p_phone: q.phone });
    if (error) return setState('error');
    if (!data) {
      setOrder(null);
      return setState('notfound');
    }
    setOrder(data);
    return setState('idle');
  }, []);

  // Auto-load when we already know code + phone, then refresh every 30s.
  useEffect(() => {
    if (initialCode && phone && !query) setQuery({ code: initialCode, phone });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!query) return undefined;
    load(query, false);
    const id = setInterval(() => load(query, true), 30000);
    return () => clearInterval(id);
  }, [query, load]);

  const submit = (e) => {
    e.preventDefault();
    setQuery({ code: code.trim().toUpperCase(), phone: phone.replace(/\D/g, '').slice(-10) });
  };

  const cancel = async () => {
    if (!window.confirm(t('track.cancelConfirm'))) return;
    await supabase.rpc('cancel_order', { p_code: query.code, p_phone: query.phone });
    load(query, false);
  };

  const fmt = (v) =>
    v
      ? new Date(v).toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
          day: 'numeric',
          month: 'short',
          hour: 'numeric',
          minute: '2-digit',
        })
      : '';

  const shopPhone = String(settings.delivery_shop_phone || '');
  const current = order ? STEPS.indexOf(order.status) : -1;

  return (
    <div className="container page narrow-wide">
      <h1 className="page-title">{t('track.title')}</h1>

      <form className="card track-form" onSubmit={submit}>
        <label className="field">
          <span>{t('track.code')}</span>
          <input value={code} onChange={(e) => setCode(e.target.value)} maxLength={10} placeholder="SH123456" />
        </label>
        <label className="field">
          <span>{t('order.phone')}</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="numeric"
            maxLength={14}
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={!code.trim() || !phone.trim()}>
          {t('track.submit')}
        </button>
      </form>

      <div aria-live="polite">
        {state === 'loading' ? <p className="status">{t('dir.loading')}</p> : null}
        {state === 'notfound' ? (
          <div className="notice notice-warn">{t('track.notFound')}</div>
        ) : null}
        {state === 'error' ? <div className="notice notice-error">{t('order.err.generic')}</div> : null}

        {order ? (
          <div className="card">
            <div className="track-head">
              <div>
                <div className="muted small">{t('track.code')}</div>
                <div className="order-code sm">{order.code}</div>
              </div>
              <span className={`badge status-${order.status}`}>{t(`status.${order.status}`)}</span>
            </div>

            {order.status === 'cancelled' ? (
              <div className="notice notice-error">
                {t('status.cancelled')} · {fmt(order.cancelled_at)}
              </div>
            ) : (
              <ol className="timeline">
                {STEPS.map((s, i) => (
                  <li key={s} className={i <= current ? 'done' : ''}>
                    <span className="timeline-dot" aria-hidden="true" />
                    <span className="timeline-label">{t(`status.${s}`)}</span>
                    <span className="muted small">{i <= current ? fmt(order[STEP_TIME[s]]) : ''}</span>
                  </li>
                ))}
              </ol>
            )}

            <dl className="detail-list">
              {order.amount !== null ? (
                <div className="detail-row">
                  <dt>{t('track.amount')}</dt>
                  <dd className="strong">₹{Number(order.amount).toFixed(2)}</dd>
                </div>
              ) : null}
              {order.shop_note ? (
                <div className="detail-row">
                  <dt>{t('track.shopNote')}</dt>
                  <dd>{order.shop_note}</dd>
                </div>
              ) : null}
              <div className="detail-row">
                <dt>{t('order.items')}</dt>
                <dd className="pre">
                  {order.items || (order.has_prescription ? t('track.rxOnly') : t('na'))}
                </dd>
              </div>
            </dl>

            <div className="form-actions">
              {shopPhone ? (
                <a className="btn btn-outline" href={telHref(shopPhone)}>
                  📞 {t('track.callShop')} {shopPhone}
                </a>
              ) : null}
              {order.status === 'placed' ? (
                <button type="button" className="btn btn-danger" onClick={cancel}>
                  {t('track.cancel')}
                </button>
              ) : null}
            </div>
            <p className="muted small">{t('track.auto')}</p>
          </div>
        ) : null}
      </div>

      <p>
        <Link to="/order">{t('order.title')} →</Link>
      </p>
    </div>
  );
}
