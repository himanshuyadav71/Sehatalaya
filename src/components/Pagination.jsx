import { useLang } from '../lib/i18n.jsx';

// Builds a compact list such as: 1 … 4 5 [6] 7 8 … 20
function pageList(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current, current - 1, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (current >= total - 2) [total - 1, total - 2, total - 3].forEach((p) => pages.add(p));
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('gap');
    out.push(p);
  });
  return out;
}

export default function Pagination({ page, totalPages, onChange }) {
  const { t } = useLang();
  if (totalPages <= 1) return null;

  return (
    <nav className="pagination" aria-label={t('page.nav')}>
      <button
        type="button"
        className="btn btn-outline"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        ← {t('page.prev')}
      </button>

      <ul className="page-numbers">
        {pageList(page, totalPages).map((p, i) =>
          p === 'gap' ? (
            <li key={`gap-${i}`} className="page-gap" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={p}>
              <button
                type="button"
                className={`page-number${p === page ? ' current' : ''}`}
                aria-label={t('page.page', { n: p })}
                aria-current={p === page ? 'page' : undefined}
                onClick={() => onChange(p)}
              >
                {p}
              </button>
            </li>
          ),
        )}
      </ul>

      <button
        type="button"
        className="btn btn-outline"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        {t('page.next')} →
      </button>
    </nav>
  );
}
