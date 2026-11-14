import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase.js';

const TABS = {
  active: { label: 'Active', statuses: ['placed', 'confirmed', 'out_for_delivery'] },
  delivered: { label: 'Delivered', statuses: ['delivered'] },
  cancelled: { label: 'Cancelled', statuses: ['cancelled'] },
};
const LABEL = {
  placed: 'New — waiting for shop',
  confirmed: 'Confirmed',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};
const NEXT = {
  placed: ['confirmed', 'Confirm order'],
  confirmed: ['out_for_delivery', 'Mark out for delivery'],
  out_for_delivery: ['delivered', 'Mark delivered'],
};

const when = (v) =>
  v ? new Date(v).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '';

function OrderCard({ order, onChanged }) {
  const [amount, setAmount] = useState(order.amount ?? '');
  const [shopNote, setShopNote] = useState(order.shop_note ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const save = async (extra = {}) => {
    setError('');
    const n = amount === '' ? null : Number(amount);
    if (n !== null && (!Number.isFinite(n) || n < 0)) return setError('Amount must be a positive number.');
    if (extra.status === 'confirmed' && n === null) {
      return setError('Enter the bill amount before confirming, so the customer knows what to pay.');
    }
    setBusy(true);
    const { error: err } = await supabase
      .from('orders')
      .update({ amount: n, shop_note: shopNote.trim() || null, ...extra })
      .eq('id', order.id);
    setBusy(false);
    if (err) return setError(err.message);
    return onChanged();
  };

  const viewRx = async () => {
    const { data, error: err } = await supabase.storage
      .from('prescriptions')
      .createSignedUrl(order.prescription_path, 300);
    if (err) return setError(`Could not open prescription: ${err.message}`);
    return window.open(data.signedUrl, '_blank', 'noopener');
  };

  const next = NEXT[order.status];
  const closed = order.status === 'delivered' || order.status === 'cancelled';

  return (
    <article className="card order-card">
      <div className="track-head">
        <div>
          <span className="order-code sm">{order.code}</span>
          <span className="muted small"> · {when(order.created_at)}</span>
        </div>
        <span className={`badge status-${order.status}`}>{LABEL[order.status]}</span>
      </div>

      <div className="order-cols">
        <div>
          <div className="strong">{order.customer_name}</div>
          <a href={`tel:+91${order.phone}`}>📞 {order.phone}</a>
          <div>{order.address}</div>
          {order.area ? <div className="muted small">Area: {order.area}</div> : null}
          {order.note ? <div className="muted small">Customer note: {order.note}</div> : null}
        </div>
        <div>
          <div className="muted small">Medicines requested</div>
          <div className="pre">{order.items || '— (see prescription)'}</div>
          {order.prescription_path ? (
            <button type="button" className="btn btn-outline btn-sm" onClick={viewRx}>
              View prescription
            </button>
          ) : (
            <div className="muted small">No prescription uploaded</div>
          )}
        </div>
      </div>

      <div className="order-edit">
        <label className="field">
          <span>Bill amount (₹)</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            disabled={closed}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
        <label className="field grow">
          <span>Note to customer (shown on tracking page)</span>
          <input
            value={shopNote}
            maxLength={300}
            disabled={closed}
            placeholder="e.g. One medicine not available; delivery by 6 pm"
            onChange={(e) => setShopNote(e.target.value)}
          />
        </label>
      </div>

      {error ? <div className="notice notice-error">{error}</div> : null}

      {!closed ? (
        <div className="row-actions">
          {next ? (
            <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => save({ status: next[0] })}>
              {next[1]}
            </button>
          ) : null}
          <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => save()}>
            Save amount / note
          </button>
          <button
            type="button"
            className="btn btn-danger btn-sm"
            disabled={busy}
            onClick={() => window.confirm(`Cancel order ${order.code}?`) && save({ status: 'cancelled' })}
          >
            Cancel order
          </button>
        </div>
      ) : null}
    </article>
  );
}

export default function AdminOrders() {
  const [tab, setTab] = useState('active');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCount, setNewCount] = useState(0);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('orders')
      .select('*')
      .in('status', TABS[tab].statuses)
      .order('created_at', { ascending: tab !== 'active' ? false : true })
      .limit(200);
    setError(err ? err.message : '');
    setOrders(data || []);
    setLoading(false);
    const { count } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'placed');
    setNewCount(count || 0);
  }, [tab]);

  useEffect(() => {
    setLoading(true);
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    document.title = `${newCount ? `(${newCount}) ` : ''}Orders — Sehatalay Admin`;
  }, [newCount]);

  return (
    <>
      <div className="admin-title-row">
        <h1 className="page-title">Medicine orders</h1>
        <button type="button" className="btn btn-outline" onClick={load}>
          Refresh
        </button>
      </div>
      <p className="muted small">
        This page refreshes every 30 seconds. Check the prescription before confirming any
        prescription medicine. The customer pays the shop on delivery.
      </p>

      <div className="tabs" role="tablist">
        {Object.entries(TABS).map(([key, t]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={`tab${tab === key ? ' active' : ''}`}
            onClick={() => setTab(key)}
          >
            {t.label}
            {key === 'active' && newCount ? <span className="tab-count">{newCount} new</span> : null}
          </button>
        ))}
      </div>

      {error ? <div className="notice notice-error">{error}</div> : null}
      {loading ? (
        <p className="status">Loading…</p>
      ) : orders.length === 0 ? (
        <div className="empty card">
          <h2>No {TABS[tab].label.toLowerCase()} orders</h2>
        </div>
      ) : (
        <div className="provider-list">
          {orders.map((o) => (
            <OrderCard key={o.id} order={o} onChanged={load} />
          ))}
        </div>
      )}
    </>
  );
}
