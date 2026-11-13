import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Pagination from '../../components/Pagination.jsx';
import { PHOTO_BUCKET, supabase } from '../../lib/supabase.js';
import { sanitizeSearch } from '../../lib/utils.js';

const ADMIN_PAGE_SIZE = 25;
const STATUSES = ['draft', 'published', 'archived'];
const TYPE_LABEL = { doctor: 'Doctor', lab: 'Lab', pharmacy: 'Pharmacy' };

// What is still missing before a draft is a complete, trustworthy listing.
// These are warnings for the owner, not blockers.
function gaps(p) {
  const out = [];
  if (!p.source_url) out.push('no source URL');
  if (!p.source_checked_on) out.push('no date checked');
  if (!p.address) out.push('no address');
  if (!p.phone) out.push('no phone');
  else if (!p.phone_verified) out.push('phone unverified');
  if (p.type === 'doctor') {
    if (!p.specialty_id) out.push('no specialty');
    if (!p.registration_number) out.push('no registration no.');
    else if (!p.registration_verified) out.push('registration unverified');
  }
  return out;
}

export default function AdminListings() {
  const [status, setStatus] = useState('draft');
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const from = (page - 1) * ADMIN_PAGE_SIZE;
    let query = supabase
      .from('providers')
      .select('*, specialties(name_en)', { count: 'exact' })
      .eq('status', status);
    if (type) query = query.eq('type', type);
    const clean = sanitizeSearch(term);
    if (clean) {
      const like = `"*${clean}*"`;
      query = query.or(
        ['name', 'area', 'address', 'clinic_name'].map((c) => `${c}.ilike.${like}`).join(','),
      );
    }
    const { data, error, count: total } = await query
      .order('name')
      .order('id')
      .range(from, from + ADMIN_PAGE_SIZE - 1);

    if (error) {
      if (page > 1) {
        setPage(1);
        return;
      }
      setMessage({ kind: 'error', text: `Could not load listings: ${error.message}` });
    }
    setRows(data || []);
    setCount(total || 0);
    setLoading(false);

    const next = {};
    await Promise.all(
      STATUSES.map(async (s) => {
        const { count: c } = await supabase
          .from('providers')
          .select('id', { count: 'exact', head: true })
          .eq('status', s);
        next[s] = c || 0;
      }),
    );
    setCounts(next);
  }, [status, type, term, page]);

  useEffect(() => {
    load();
  }, [load]);

  const setRowStatus = async (p, nextStatus) => {
    if (nextStatus === 'published') {
      const missing = gaps(p);
      const warning = missing.length
        ? `\n\nStill missing / unverified:\n• ${missing.join('\n• ')}\n\nMissing details will be shown publicly as "N/A".`
        : '';
      const ok = window.confirm(
        `Publish "${p.name}"?\n\nBy approving, you confirm you have reviewed this listing and that the business or doctor is real.${warning}`,
      );
      if (!ok) return;
    }
    const { error } = await supabase.from('providers').update({ status: nextStatus }).eq('id', p.id);
    if (error) {
      setMessage({ kind: 'error', text: `Update failed: ${error.message}` });
      return;
    }
    setMessage({ kind: 'ok', text: `"${p.name}" is now ${nextStatus}.` });
    load();
  };

  const remove = async (p) => {
    if (!window.confirm(`Permanently delete "${p.name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from('providers').delete().eq('id', p.id);
    if (error) {
      setMessage({ kind: 'error', text: `Delete failed: ${error.message}` });
      return;
    }
    if (p.photo_path) await supabase.storage.from(PHOTO_BUCKET).remove([p.photo_path]);
    setMessage({ kind: 'ok', text: `"${p.name}" was deleted.` });
    load();
  };

  const totalPages = Math.max(1, Math.ceil(count / ADMIN_PAGE_SIZE));

  return (
    <>
      <div className="admin-title-row">
        <h1 className="page-title">Listings</h1>
        <Link to="/admin/new" className="btn btn-primary">
          + Add provider
        </Link>
      </div>

      <div className="tabs" role="tablist">
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={status === s}
            className={`tab${status === s ? ' active' : ''}`}
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
          >
            {s === 'draft' ? 'Drafts (awaiting approval)' : s[0].toUpperCase() + s.slice(1)}
            <span className="tab-count">{counts[s] ?? '–'}</span>
          </button>
        ))}
      </div>

      <form
        className="admin-filters"
        onSubmit={(e) => {
          e.preventDefault();
          setTerm(search);
          setPage(1);
        }}
      >
        <select
          aria-label="Provider type"
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All types</option>
          <option value="doctor">Doctors</option>
          <option value="lab">Labs</option>
          <option value="pharmacy">Pharmacies</option>
        </select>
        <input
          type="search"
          aria-label="Search listings"
          placeholder="Search name, area, address"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" className="btn btn-outline">
          Search
        </button>
      </form>

      {message ? (
        <div className={`notice ${message.kind === 'ok' ? 'notice-ok' : 'notice-error'}`} role="status">
          {message.text}
        </div>
      ) : null}

      {status === 'draft' ? (
        <p className="muted small">
          Drafts are never visible to the public. Review each record against its source, verify what
          you can, then approve it.
        </p>
      ) : null}

      {loading ? (
        <p className="status">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="empty card">
          <h2>No {status} listings</h2>
          <p className="muted">
            Add a provider manually or import researched records from a CSV file.
          </p>
        </div>
      ) : (
        <div className="table-wrap card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Area</th>
                <th>Checks</th>
                <th>Source</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const missing = gaps(p);
                return (
                  <tr key={p.id}>
                    <td>
                      <Link to={`/admin/edit/${p.id}`} className="strong">
                        {p.name}
                      </Link>
                      {p.type === 'doctor' ? (
                        <div className="muted small">{p.specialties?.name_en || 'No specialty'}</div>
                      ) : null}
                    </td>
                    <td>{TYPE_LABEL[p.type]}</td>
                    <td>{p.area || <span className="muted">N/A</span>}</td>
                    <td>
                      {p.verified ? <span className="badge badge-verified">Verified</span> : null}
                      {missing.length === 0 ? (
                        <span className="badge badge-ok">Complete</span>
                      ) : (
                        <span className="small muted">{missing.join(', ')}</span>
                      )}
                    </td>
                    <td className="small">
                      {p.source_url ? (
                        <a href={p.source_url} target="_blank" rel="noopener noreferrer">
                          Open source
                        </a>
                      ) : (
                        <span className="muted">N/A</span>
                      )}
                      <div className="muted">{p.source_checked_on || 'not dated'}</div>
                    </td>
                    <td>
                      <div className="row-actions">
                        <Link to={`/admin/edit/${p.id}`} className="btn btn-outline btn-sm">
                          Edit
                        </Link>
                        {p.status !== 'published' ? (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => setRowStatus(p, 'published')}
                          >
                            Approve &amp; publish
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => setRowStatus(p, 'draft')}
                          >
                            Unpublish
                          </button>
                        )}
                        {p.status !== 'archived' ? (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => setRowStatus(p, 'archived')}
                          >
                            Archive
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => remove(p)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </>
  );
}
