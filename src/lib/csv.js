// Pure CSV-row validation shared by the admin importer (browser) and
// scripts/csv-to-sql.mjs (Node). No browser or Supabase dependencies.
import { CSV_COLUMNS, PROVIDER_TYPES } from './constants.js';
import { emptyToNull, isHttpUrl } from './utils.js';

export const REQUIRED_COLUMNS = ['type', 'name'];

export function missingColumns(headerFields) {
  const have = new Set((headerFields || []).map((h) => String(h).trim().toLowerCase()));
  return REQUIRED_COLUMNS.filter((c) => !have.has(c));
}

export function unknownColumns(headerFields) {
  const known = new Set(CSV_COLUMNS);
  return (headerFields || [])
    .map((h) => String(h).trim().toLowerCase())
    .filter((h) => h && !known.has(h));
}

export function dedupeKey(row) {
  const norm = (v) =>
    String(v || '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim();
  return `${row.type}|${norm(row.name)}|${norm(row.address)}`;
}

function isIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/**
 * Validate and normalise one CSV row.
 * @param raw            object keyed by CSV header
 * @param specialtyBySlug Map of slug -> specialty id (or slug -> true in Node)
 * @returns { record, errors, warnings }
 *
 * Imported rows are ALWAYS drafts with every verification flag off. The
 * CSV cannot publish or verify anything; only the owner can, one listing
 * at a time, in the dashboard.
 */
export function normaliseRow(raw, specialtyBySlug) {
  const errors = [];
  const warnings = [];
  const get = (k) => {
    const key = Object.keys(raw).find((h) => h.trim().toLowerCase() === k);
    return emptyToNull(key ? raw[key] : null);
  };

  const type = (get('type') || '').toLowerCase();
  if (!PROVIDER_TYPES.includes(type)) {
    errors.push(`type must be one of: ${PROVIDER_TYPES.join(', ')}`);
  }

  const name = get('name');
  if (!name) errors.push('name is required');

  let experience = null;
  const expRaw = get('experience_years');
  if (expRaw !== null) {
    const n = Number(expRaw);
    if (Number.isInteger(n) && n >= 0 && n <= 80) experience = n;
    else errors.push('experience_years must be a whole number between 0 and 80');
  }

  let checkedOn = get('source_checked_on');
  if (checkedOn !== null && !isIsoDate(checkedOn)) {
    errors.push('source_checked_on must be a date in YYYY-MM-DD format');
    checkedOn = null;
  }

  const urls = {};
  ['maps_url', 'website_url', 'source_url'].forEach((k) => {
    const v = get(k);
    if (v !== null && !isHttpUrl(v)) errors.push(`${k} must start with http:// or https://`);
    urls[k] = v;
  });

  const slug = (get('specialty_slug') || '').toLowerCase() || null;
  let specialtyId = null;
  if (type === 'doctor' && slug) {
    if (specialtyBySlug.has(slug)) specialtyId = specialtyBySlug.get(slug);
    else warnings.push(`unknown specialty_slug "${slug}" — imported without a specialty`);
  }

  if (!urls.source_url) warnings.push('no source_url recorded');
  if (!checkedOn) warnings.push('no source_checked_on date');

  const isDoctor = type === 'doctor';
  const record = {
    type,
    status: 'draft',
    name,
    name_hi: get('name_hi'),
    specialty_id: specialtyId,
    specialty_slug: isDoctor ? slug : null, // helper only; removed before insert
    qualifications: isDoctor ? get('qualifications') : null,
    experience_years: isDoctor ? experience : null,
    registration_number: isDoctor ? get('registration_number') : null,
    registration_council: isDoctor ? get('registration_council') : null,
    registration_verified: false,
    clinic_name: get('clinic_name'),
    address: get('address'),
    area: get('area'),
    city: get('city') || 'Dewas',
    state: get('state') || 'Madhya Pradesh',
    pincode: get('pincode'),
    phone: get('phone'),
    phone_verified: false,
    maps_url: urls.maps_url,
    website_url: urls.website_url,
    timings: get('timings'),
    source_url: urls.source_url,
    source_checked_on: checkedOn,
    source_notes: get('source_notes'),
    verified: false,
  };

  return { record, errors, warnings };
}
