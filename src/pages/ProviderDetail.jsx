import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AdSlot from '../components/AdSlot.jsx';
import Avatar from '../components/Avatar.jsx';
import ContactActions from '../components/ContactActions.jsx';
import { VerifiedBadge } from '../components/ProviderCard.jsx';
import { TYPE_ROUTES } from '../lib/constants.js';
import { useLang } from '../lib/i18n.jsx';
import { supabase } from '../lib/supabase.js';
import { formatDate, isHttpUrl, mapsSearchUrl, telHref } from '../lib/utils.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function Row({ label, children }) {
  const { t } = useLang();
  const empty = children === null || children === undefined || children === '';
  return (
    <div className="detail-row">
      <dt>{label}</dt>
      <dd className={empty ? 'muted' : undefined}>{empty ? t('na') : children}</dd>
    </div>
  );
}

export default function ProviderDetail() {
  const { id } = useParams();
  const { t, pick, lang } = useLang();
  const [state, setState] = useState({ loading: true, provider: null });

  useEffect(() => {
    if (!supabase || !UUID.test(id || '')) {
      setState({ loading: false, provider: null });
      return undefined;
    }
    let active = true;
    setState({ loading: true, provider: null });
    supabase
      .from('public_providers')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setState({ loading: false, provider: data || null });
      });
    return () => {
      active = false;
    };
  }, [id]);

  const p = state.provider;

  useEffect(() => {
    if (p) document.title = `${pick(p.name, p.name_hi)} — ${t('brand')}`;
  }, [p, pick, t]);

  if (state.loading) {
    return (
      <div className="container page">
        <p className="status">{t('dir.loading')}</p>
      </div>
    );
  }

  if (!p) {
    return (
      <div className="container page">
        <div className="empty card">
          <h1>{t('detail.notFound')}</h1>
          <Link className="btn btn-primary" to="/doctors">
            {t('nav.doctors')}
          </Link>
        </div>
      </div>
    );
  }

  const isDoctor = p.type === 'doctor';
  const fullAddress = [p.address, p.area, p.city, p.state, p.pincode]
    .filter(Boolean)
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .join(', ');
  const listingMap = isHttpUrl(p.maps_url) ? p.maps_url : null;
  const searchMap = listingMap ? null : mapsSearchUrl(p);

  return (
    <div className="container page">
      <Link className="back-link" to={TYPE_ROUTES[p.type]}>
        ← {t('detail.back')}
      </Link>

      <section className="card detail-head">
        <Avatar provider={p} size="lg" />
        <div className="detail-head-main">
          <h1 className="detail-name">
            {pick(p.name, p.name_hi)}
            {p.verified ? <VerifiedBadge /> : null}
          </h1>
          {isDoctor ? (
            <p className="detail-sub">
              {pick(p.specialty_name_en, p.specialty_name_hi) ||
                `${t('field.specialty')}: ${t('na')}`}
            </p>
          ) : null}
          {p.clinic_name ? <p className="muted">{p.clinic_name}</p> : null}
          <ContactActions />
        </div>
      </section>

      <div className="detail-grid">
        <section className="card">
          <h2 className="section-title">{t('detail.details')}</h2>
          <dl className="detail-list">
            {isDoctor ? (
              <>
                <Row label={t('field.specialty')}>
                  {pick(p.specialty_name_en, p.specialty_name_hi)}
                </Row>
                <Row label={t('field.qualifications')}>{p.qualifications}</Row>
                <Row label={t('field.experience')}>
                  {p.experience_years !== null && p.experience_years !== undefined
                    ? t('field.experienceYears', { n: p.experience_years })
                    : null}
                </Row>
                <Row label={t('field.registration')}>
                  {p.registration_number ? (
                    <>
                      {p.registration_number}{' '}
                      <span
                        className={`badge ${p.registration_verified ? 'badge-verified' : 'badge-muted'}`}
                      >
                        {t(p.registration_verified ? 'field.regVerified' : 'field.regNotVerified')}
                      </span>
                    </>
                  ) : null}
                </Row>
                <Row label={t('field.council')}>{p.registration_council}</Row>
                <Row label={t('field.clinic')}>{p.clinic_name}</Row>
              </>
            ) : null}
            <Row label={t('field.timings')}>{p.timings}</Row>
            <Row label={t('field.website')}>
              {isHttpUrl(p.website_url) ? (
                <a href={p.website_url} target="_blank" rel="noopener noreferrer nofollow">
                  {p.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </a>
              ) : null}
            </Row>
          </dl>
        </section>

        <section className="card">
          <h2 className="section-title">{t('detail.contact')}</h2>
          <dl className="detail-list">
            <Row label={t('field.verifiedPhone')}>
              {p.verified_phone ? (
                <a className="phone-link" href={telHref(p.verified_phone)}>
                  {p.verified_phone}
                </a>
              ) : null}
            </Row>
            <Row label={t('field.address')}>{fullAddress}</Row>
            <Row label={t('field.area')}>{p.area}</Row>
          </dl>
          {listingMap ? (
            <a
              className="btn btn-outline"
              href={listingMap}
              target="_blank"
              rel="noopener noreferrer"
            >
              📍 {t('field.maps')}
            </a>
          ) : searchMap ? (
            <a className="btn btn-outline" href={searchMap} target="_blank" rel="noopener noreferrer">
              📍 {t('field.mapsSearch')}
            </a>
          ) : null}
        </section>
      </div>

      <p className="muted small">
        {t('detail.disclaimer')} <Link to="/about">{t('detail.report')}</Link>
      </p>
      <p className="muted small">
        {t('field.updated')}: {formatDate(p.updated_at, lang)}
      </p>

      <AdSlot />
    </div>
  );
}
