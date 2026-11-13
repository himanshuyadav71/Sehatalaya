import { useCallback, useEffect, useState } from 'react';
import { ORGANS } from '../../lib/constants.js';
import { supabase } from '../../lib/supabase.js';

const BLANK = { slug: '', name_en: '', name_hi: '', organ_key: 'general', sort_order: 100 };

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function Specialties() {
  const [rows, setRows] = useState([]);
  const [usage, setUsage] = useState({});
  const [draft, setDraft] = useState(BLANK);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [{ data }, { data: used }] = await Promise.all([
      supabase.from('specialties').select('*').order('sort_order').order('name_en'),
      supabase.from('providers').select('specialty_id').not('specialty_id', 'is', null),
    ]);
    setRows(data || []);
    const counts = {};
    (used || []).forEach((r) => {
      counts[r.specialty_id] = (counts[r.specialty_id] || 0) + 1;
    });
    setUsage(counts);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const fail = (error) => {
    const text =
      error.code === '23505' ? 'That slug is already in use.' : `Could not save: ${error.message}`;
    setMessage({ kind: 'error', text });
  };

  const add = async (e) => {
    e.preventDefault();
    const slug = slugify(draft.slug || draft.name_en);
    if (!draft.name_en.trim() || !slug) {
      setMessage({ kind: 'error', text: 'English name is required.' });
      return;
    }
    const { error } = await supabase.from('specialties').insert({
      slug,
      name_en: draft.name_en.trim(),
      name_hi: draft.name_hi.trim() || null,
      organ_key: draft.organ_key,
      sort_order: Number(draft.sort_order) || 100,
    });
    if (error) return fail(error);
    setDraft(BLANK);
    setMessage({ kind: 'ok', text: 'Specialty added.' });
    return load();
  };

  const saveEdit = async () => {
    if (!editing.name_en.trim()) {
      setMessage({ kind: 'error', text: 'English name is required.' });
      return;
    }
    const { error } = await supabase
      .from('specialties')
      .update({
        name_en: editing.name_en.trim(),
        name_hi: editing.name_hi?.trim() || null,
        organ_key: editing.organ_key,
        sort_order: Number(editing.sort_order) || 100,
      })
      .eq('id', editing.id);
    if (error) return fail(error);
    setEditing(null);
    setMessage({ kind: 'ok', text: 'Specialty updated.' });
    return load();
  };

  const toggle = async (row) => {
    const { error } = await supabase
      .from('specialties')
      .update({ active: !row.active })
      .eq('id', row.id);
    if (error) return fail(error);
    return load();
  };

  const remove = async (row) => {
    const n = usage[row.id] || 0;
    const note = n ? `\n\n${n} provider(s) use it and will be left without a specialty.` : '';
    if (!window.confirm(`Delete the specialty "${row.name_en}"?${note}`)) return undefined;
    const { error } = await supabase.from('specialties').delete().eq('id', row.id);
    if (error) return fail(error);
    setMessage({ kind: 'ok', text: 'Specialty deleted.' });
    return load();
  };

  const organSelect = (value, onChange, label) => (
    <select aria-label={label} value={value} onChange={onChange}>
      {ORGANS.map((o) => (
        <option key={o.key} value={o.key}>
          {o.en}
        </option>
      ))}
    </select>
  );

  return (
    <>
      <h1 className="page-title">Specialties</h1>
      <p className="muted">
        Each specialty belongs to one health-concern group, which drives the organ-based filter on
        the doctors page. Inactive specialties are hidden from the public filter.
      </p>

      {message ? (
        <div className={`notice ${message.kind === 'ok' ? 'notice-ok' : 'notice-error'}`} role="status">
          {message.text}
        </div>
      ) : null}

      <form className="card" onSubmit={add}>
        <h2 className="section-title">Add a specialty</h2>
        <div className="form-grid">
          <label className="field">
            <span>Name (English) *</span>
            <input
              value={draft.name_en}
              onChange={(e) => setDraft({ ...draft, name_en: e.target.value })}
              maxLength={120}
            />
          </label>
          <label className="field">
            <span>Name (Hindi)</span>
            <input
              lang="hi"
              value={draft.name_hi}
              onChange={(e) => setDraft({ ...draft, name_hi: e.target.value })}
              maxLength={120}
            />
          </label>
          <label className="field">
            <span>Slug (used in CSV imports)</span>
            <input
              value={draft.slug}
              placeholder={slugify(draft.name_en) || 'auto from English name'}
              onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
              maxLength={60}
            />
          </label>
          <label className="field">
            <span>Health-concern group</span>
            {organSelect(
              draft.organ_key,
              (e) => setDraft({ ...draft, organ_key: e.target.value }),
              'Health-concern group',
            )}
          </label>
          <label className="field">
            <span>Sort order</span>
            <input
              type="number"
              value={draft.sort_order}
              onChange={(e) => setDraft({ ...draft, sort_order: e.target.value })}
            />
          </label>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            Add specialty
          </button>
        </div>
      </form>

      {loading ? (
        <p className="status">Loading…</p>
      ) : (
        <div className="table-wrap card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>English</th>
                <th>Hindi</th>
                <th>Slug</th>
                <th>Group</th>
                <th>Order</th>
                <th>Used by</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) =>
                editing?.id === row.id ? (
                  <tr key={row.id}>
                    <td>
                      <input
                        aria-label="English name"
                        value={editing.name_en}
                        onChange={(e) => setEditing({ ...editing, name_en: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        aria-label="Hindi name"
                        lang="hi"
                        value={editing.name_hi || ''}
                        onChange={(e) => setEditing({ ...editing, name_hi: e.target.value })}
                      />
                    </td>
                    <td className="muted">{row.slug}</td>
                    <td>
                      {organSelect(
                        editing.organ_key,
                        (e) => setEditing({ ...editing, organ_key: e.target.value }),
                        'Health-concern group',
                      )}
                    </td>
                    <td>
                      <input
                        aria-label="Sort order"
                        type="number"
                        className="input-narrow"
                        value={editing.sort_order}
                        onChange={(e) => setEditing({ ...editing, sort_order: e.target.value })}
                      />
                    </td>
                    <td>{usage[row.id] || 0}</td>
                    <td>
                      <div className="row-actions">
                        <button type="button" className="btn btn-primary btn-sm" onClick={saveEdit}>
                          Save
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setEditing(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={row.id} className={row.active ? '' : 'row-skip'}>
                    <td>
                      {row.name_en}
                      {row.active ? null : <span className="badge badge-muted">Inactive</span>}
                    </td>
                    <td lang="hi">{row.name_hi || <span className="muted">N/A</span>}</td>
                    <td className="muted">{row.slug}</td>
                    <td>{ORGANS.find((o) => o.key === row.organ_key)?.en || row.organ_key}</td>
                    <td>{row.sort_order}</td>
                    <td>{usage[row.id] || 0}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => setEditing({ ...row })}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => toggle(row)}
                        >
                          {row.active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => remove(row)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
