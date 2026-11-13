import Papa from 'papaparse';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CSV_COLUMNS } from '../../lib/constants.js';
import { dedupeKey, missingColumns, normaliseRow, unknownColumns } from '../../lib/csv.js';
import { supabase } from '../../lib/supabase.js';

const BATCH = 100;
const MAX_ROWS = 2000;

const TEMPLATE =
  `${CSV_COLUMNS.join(',')}\n` +
  'doctor,,,general-physician,,,,,,,,Dewas,Madhya Pradesh,,,,,,,,\n';

function downloadTemplate() {
  const blob = new Blob([TEMPLATE], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sehatalaya-import-template.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function fetchExistingKeys() {
  const keys = new Set();
  let from = 0;
  // Page through all existing providers (any status) for duplicate checks.
  for (;;) {
    const { data, error } = await supabase
      .from('providers')
      .select('type, name, address')
      .order('id')
      .range(from, from + 999);
    if (error) throw error;
    data.forEach((r) => keys.add(dedupeKey(r)));
    if (data.length < 1000) break;
    from += 1000;
  }
  return keys;
}

export default function ImportCsv() {
  const [specialties, setSpecialties] = useState(new Map());
  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState('');
  const [headerNotes, setHeaderNotes] = useState([]);
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    supabase
      .from('specialties')
      .select('id, slug')
      .then(({ data }) => setSpecialties(new Map((data || []).map((s) => [s.slug, s.id]))));
  }, []);

  const onFile = (e) => {
    const file = e.target.files?.[0];
    setResult(null);
    setRows([]);
    setParseError('');
    setHeaderNotes([]);
    if (!file) return;
    setFileName(file.name);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h) => h.replace(/^﻿/, '').trim().toLowerCase(),
      complete: async (parsed) => {
        const fields = parsed.meta.fields || [];
        const missing = missingColumns(fields);
        if (missing.length) {
          setParseError(`The file is missing required column(s): ${missing.join(', ')}.`);
          return;
        }
        if (parsed.data.length > MAX_ROWS) {
          setParseError(`The file has more than ${MAX_ROWS} rows. Split it into smaller files.`);
          return;
        }
        const unknown = unknownColumns(fields);
        setHeaderNotes(
          unknown.length ? [`Ignored unknown column(s): ${unknown.join(', ')}.`] : [],
        );

        let existing;
        try {
          existing = await fetchExistingKeys();
        } catch (err) {
          setParseError(`Could not check for duplicates: ${err.message}`);
          return;
        }

        const seen = new Set();
        const prepared = parsed.data.map((raw, i) => {
          const { record, errors, warnings } = normaliseRow(raw, specialties);
          let duplicate = '';
          if (!errors.length) {
            const key = dedupeKey(record);
            if (existing.has(key)) duplicate = 'already in the database';
            else if (seen.has(key)) duplicate = 'repeated in this file';
            seen.add(key);
          }
          return { line: i + 2, record, errors, warnings, duplicate };
        });
        setRows(prepared);
      },
      error: (err) => setParseError(`Could not read the file: ${err.message}`),
    });
  };

  const summary = useMemo(() => {
    const invalid = rows.filter((r) => r.errors.length).length;
    const duplicates = rows.filter((r) => !r.errors.length && r.duplicate).length;
    return { total: rows.length, invalid, duplicates, ready: rows.length - invalid - duplicates };
  }, [rows]);

  const runImport = async () => {
    const ready = rows.filter((r) => !r.errors.length && !r.duplicate);
    if (!ready.length) return;
    setBusy(true);
    let inserted = 0;
    let failure = '';
    for (let i = 0; i < ready.length; i += BATCH) {
      const batch = ready.slice(i, i + BATCH).map(({ record }) => {
        const { specialty_slug: _slug, ...row } = record;
        return row;
      });
      const { error } = await supabase.from('providers').insert(batch);
      if (error) {
        failure = error.message;
        break;
      }
      inserted += batch.length;
    }
    setBusy(false);
    setResult({ inserted, failure });
    if (!failure) setRows([]);
  };

  return (
    <>
      <h1 className="page-title">Import researched records (CSV)</h1>

      <div className="notice notice-info">
        <strong>Every imported row becomes a draft.</strong> Nothing is published or marked verified
        by an import. After importing, open each draft, check it against its source, and approve it
        from the Listings page.
      </div>

      <div className="card">
        <h2 className="section-title">1. Prepare the file</h2>
        <p>
          Use the template so the column names match. Leave a cell empty (or write N/A) when the
          information is not available. Dates use the format YYYY-MM-DD.
        </p>
        <p className="small muted">Columns: {CSV_COLUMNS.join(', ')}</p>
        <p className="small muted">
          <code>type</code> is doctor, lab or pharmacy. <code>specialty_slug</code> must match a slug
          on the <Link to="/admin/specialties">Specialties</Link> page (doctors only).
        </p>
        <button type="button" className="btn btn-outline" onClick={downloadTemplate}>
          Download CSV template
        </button>
      </div>

      <div className="card">
        <h2 className="section-title">2. Choose the file</h2>
        <label className="field">
          <span>CSV file (UTF-8)</span>
          <input type="file" accept=".csv,text/csv" onChange={onFile} />
        </label>
        {parseError ? (
          <div className="notice notice-error" role="alert">
            {parseError}
          </div>
        ) : null}
        {headerNotes.map((n) => (
          <p key={n} className="small muted">
            {n}
          </p>
        ))}
      </div>

      {rows.length ? (
        <div className="card">
          <h2 className="section-title">3. Review and import</h2>
          <p>
            <strong>{fileName}</strong>: {summary.total} row(s) — {summary.ready} ready,{' '}
            {summary.duplicates} duplicate(s) skipped, {summary.invalid} with errors skipped.
          </p>
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Line</th>
                  <th>Type</th>
                  <th>Name</th>
                  <th>Area</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.line} className={r.errors.length ? 'row-error' : r.duplicate ? 'row-skip' : ''}>
                    <td>{r.line}</td>
                    <td>{r.record.type || '—'}</td>
                    <td>{r.record.name || '—'}</td>
                    <td>{r.record.area || 'N/A'}</td>
                    <td className="small">
                      {r.errors.length ? (
                        <span className="text-error">Error: {r.errors.join('; ')}</span>
                      ) : r.duplicate ? (
                        <span>Skipped — {r.duplicate}</span>
                      ) : (
                        <span className="text-ok">Ready (draft)</span>
                      )}
                      {r.warnings.length && !r.errors.length ? (
                        <div className="muted">Note: {r.warnings.join('; ')}</div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy || summary.ready === 0}
              onClick={runImport}
            >
              {busy ? 'Importing…' : `Import ${summary.ready} row(s) as drafts`}
            </button>
          </div>
        </div>
      ) : null}

      {result ? (
        <div className={`notice ${result.failure ? 'notice-error' : 'notice-ok'}`} role="status">
          {result.inserted} record(s) imported as drafts.
          {result.failure ? ` Import stopped: ${result.failure}` : ''}{' '}
          <Link to="/admin">Review drafts</Link>
        </div>
      ) : null}
    </>
  );
}
