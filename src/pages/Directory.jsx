import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdSlot from '../components/AdSlot.jsx';
import Pagination from '../components/Pagination.jsx';
import ProviderCard from '../components/ProviderCard.jsx';
import { ORGANS, PAGE_SIZE } from '../lib/constants.js';
import { useLang } from '../lib/i18n.jsx';
import { useSettings } from '../lib/settings.jsx';
import { supabase } from '../lib/supabase.js';
import { sanitizeSearch } from '../lib/utils.js';

const TITLE_KEYS = {
  doctor: 'dir.doctors.title',
  lab: 'dir.labs.title',
  pharmacy: 'dir.pharmacies.title',
};

// Neutral sort options only: alphabetical by name or area. There is no
// rating, popularity or paid ordering anywhere in the product.
const SORTS = {
  name_asc: { column: 'name', ascending: true, label: 'dir.sort.nameAsc' },
  name_desc: { column: 'name', ascending: false, label: 'dir.sort.nameDesc' },
  area: { column: 'area', ascending: true, label: 'dir.sort.area' },
};

export default function Directory({ type }) {
  const { t, pick, lang } = useLang();
  const [params, setParams] = useSearchParams();
  const { settings } = useSettings();
  const contactEmail = String(settings.contact_email || '').trim();
  const isDoctor = type === 'doctor';

  const q = params.get('q') || '';
  const specialty = isDoctor ? params.get('specialty') || '' : '';
  const organ = isDoctor ? params.get('organ') || '' : '';
  const area = params.get('area') || '';
  const sort = SORTS[params.get('sort')] ? params.get('sort') : 'name_asc';
  const page = Math.max(1, parseInt(params.get('page') || '1', 10) || 1);

  const [searchText, setSearchText] = useState(q);
  const [specialties, setSpecialties] = useState([]);
  const [areas, setAreas] = useState([]);
  const [state, setState] = useState({ loading: true, error: false, rows: [], count: 0 });

  useEffect(() => setSearchText(q), [q]);

  useEffect(() => {
    document.title = `${t(TITLE_KEYS[type])} — ${t('brand')}`;
  }, [type, t]);

  // Filter options
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.rpc('public_areas', { p_type: type }).then(({ data }) => {
      if (active) setAreas((data || []).map((r) => r.area));
    });
    if (isDoctor) {
      supabase
        .from('specialties')
        .select('slug, name_en, name_hi, organ_key')
        .eq('active', true)
        .order('sort_order')
        .order('name_en')
        .then(({ data }) => {
          if (active) setSpecialties(data || []);
        });
    }
    return () => {
      active = false;
    };
  }, [type, isDoctor]);

  // Listings
  useEffect(() => {
    if (!supabase) {
      setState({ loading: false, error: false, rows: [], count: 0 });
      return undefined;
    }
    let active = true;
    setState((s) => ({ ...s, loading: true, error: false }));

    const from = (page - 1) * PAGE_SIZE;
    let query = supabase
      .from('public_providers')
      .select('*', { count: 'exact' })
      .eq('type', type);

    if (specialty) query = query.eq('specialty_slug', specialty);
    if (organ) query = query.eq('organ_key', organ);
    if (area) query = query.eq('area', area);

    const term = sanitizeSearch(q);
    if (term) {
      const like = `"*${term}*"`;
      const columns = ['name', 'name_hi', 'area', 'address', 'clinic_name'];
      if (isDoctor) columns.push('specialty_name_en', 'specialty_name_hi');
      query = query.or(columns.map((c) => `${c}.ilike.${like}`).join(','));
    }

    const s = SORTS[sort];
    query = query
      .order(s.column, { ascending: s.ascending, nullsFirst: false })
      .order('name', { ascending: true })
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    query.then(({ data, error, count }) => {
      if (!active) return;
      if (error) {
        // Requested page is beyond the last page: go back to page 1.
        if (page > 1) {
          const next = new URLSearchParams(params);
          next.delete('page');
          setParams(next, { replace: true });
          return;
        }
        setState({ loading: false, error: true, rows: [], count: 0 });
        return;
      }
      setState({ loading: false, error: false, rows: data || [], count: count || 0 });
    });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, q, specialty, organ, area, sort, page, isDoctor]);

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => {
      if (v) next.set(k, v);
      else next.delete(k);
    });
    if (!('page' in changes)) next.delete('page');
    setParams(next);
  };

  const goToPage = (n) => {
    update({ page: n > 1 ? String(n) : '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const visibleSpecialties = useMemo(
    () => (organ ? specialties.filter((s) => s.organ_key === organ) : specialties),
    [specialties, organ],
  );

  const totalPages = Math.max(1, Math.ceil(state.count / PAGE_SIZE));
  const hasFilters = Boolean(q || specialty || organ || area);
  const from = state.count === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, state.count);

  return (
    <div className="container page">
      <h1 className="page-title">{t(TITLE_KEYS[type])}</h1>
      <p className="muted neutral-note">{t('dir.neutral')}</p>

      <form
        className="filters card"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          update({ q: searchText.trim() });
        }}
      >
        <div className="filter-search">
          <label className="sr-only" htmlFor="dir-search">
            {t(isDoctor ? 'dir.searchDoctors' : 'dir.searchOther')}
          </label>
          <input
            id="dir-search"
            type="search"
            value={searchText}
            maxLength={80}
            placeholder={t(isDoctor ? 'dir.searchDoctors' : 'dir.searchOther')}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">
            {t('home.search')}
          </button>
        </div>

        <div className="filter-row">
          {isDoctor ? (
            <label className="field">
              <span>{t('dir.organ')}</span>
              <select
                value={organ}
                onChange={(e) => update({ organ: e.target.value, specialty: '' })}
              >
                <option value="">{t('dir.allOrgans')}</option>
                {ORGANS.map((o) => (
                  <option key={o.key} value={o.key}>
                    {lang === 'hi' ? o.hi : o.en}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {isDoctor ? (
            <label className="field">
              <span>{t('dir.specialty')}</span>
              <select value={specialty} onChange={(e) => update({ specialty: e.target.value })}>
                <option value="">{t('dir.allSpecialties')}</option>
                {visibleSpecialties.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {pick(s.name_en, s.name_hi)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="field">
            <span>{t('dir.area')}</span>
            <select value={area} onChange={(e) => update({ area: e.target.value })}>
              <option value="">{t('dir.allAreas')}</option>
              {areas.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>{t('dir.sort')}</span>
            <select
              value={sort}
              onChange={(e) => update({ sort: e.target.value === 'name_asc' ? '' : e.target.value })}
            >
              {Object.entries(SORTS).map(([key, s]) => (
                <option key={key} value={key}>
                  {t(s.label)}
                </option>
              ))}
            </select>
          </label>

          {hasFilters ? (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setParams(sort === 'name_asc' ? {} : { sort })}
            >
              {t('dir.clear')}
            </button>
          ) : null}
        </div>
      </form>

      <div aria-live="polite">
        {state.loading ? (
          <p className="status">{t('dir.loading')}</p>
        ) : state.error ? (
          <div className="notice notice-warn" role="alert">
            {t('dir.error')}
          </div>
        ) : state.count === 0 ? (
          <div className="empty card">
            <h2>{t(hasFilters ? 'dir.emptyFiltered.title' : 'dir.empty.title')}</h2>
            <p className="muted">{t(hasFilters ? 'dir.emptyFiltered.body' : 'dir.empty.body')}</p>
            {contactEmail ? (
              <p className="small">
                {t('cta.list')} <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
              </p>
            ) : null}
          </div>
        ) : (
          <>
            <p className="muted result-count">{t('dir.showing', { from, to, count: state.count })}</p>
            <div className="provider-list">
              {state.rows.map((p) => (
                <ProviderCard key={p.id} provider={p} />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} onChange={goToPage} />
          </>
        )}
      </div>

      <AdSlot />
    </div>
  );
}
