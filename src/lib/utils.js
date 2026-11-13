// Remove characters that have special meaning in PostgREST filter strings
// so user input can be used safely inside .or() / .ilike().
export function sanitizeSearch(input) {
  return String(input || '')
    .replace(/[,()*%\\"':]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

export function isHttpUrl(value) {
  if (!value) return false;
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

// A neutral "search this address" link. It is built from our own stored
// name and address; nothing is read from Google Maps.
export function mapsSearchUrl(provider) {
  const parts = [provider.clinic_name || provider.name, provider.address, provider.city]
    .filter(Boolean)
    .join(', ');
  if (!parts) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts)}`;
}

export function telHref(phone) {
  const digits = String(phone || '').replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : null;
}

// Empty strings and "N/A"-style markers are stored as NULL so the site
// can display a consistent, translated "N/A".
export function emptyToNull(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (!s) return null;
  if (/^(n\/?a|na|none|null|-|—|not available|unknown)$/i.test(s)) return null;
  return s;
}

export function formatDate(value, lang) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function todayIso() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}
