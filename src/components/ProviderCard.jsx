import { Link } from 'react-router-dom';
import Avatar from './Avatar.jsx';
import ContactActions from './ContactActions.jsx';
import { useLang } from '../lib/i18n.jsx';
import { telHref } from '../lib/utils.js';

export function VerifiedBadge() {
  const { t } = useLang();
  return (
    <span className="badge badge-verified" title={t('card.verifiedTitle')}>
      ✓ {t('card.verified')}
    </span>
  );
}

export default function ProviderCard({ provider }) {
  const { t, pick } = useLang();
  const p = provider;
  const name = pick(p.name, p.name_hi);
  const specialty = pick(p.specialty_name_en, p.specialty_name_hi);
  const place = [p.clinic_name, p.area || p.address].filter(Boolean).join(' · ');

  return (
    <article className="card provider-card">
      <Avatar provider={p} />

      <div className="provider-main">
        <h2 className="provider-name">
          <Link to={`/provider/${p.id}`}>{name}</Link>
          {p.verified ? <VerifiedBadge /> : null}
        </h2>

        {p.type === 'doctor' ? (
          <p className="provider-line">
            <span className="strong">{specialty || t('na')}</span>
            <span className="dot">•</span>
            <span>{p.qualifications || `${t('field.qualifications')}: ${t('na')}`}</span>
          </p>
        ) : null}

        {p.type === 'doctor' ? (
          <p className="provider-line muted">
            {p.experience_years !== null && p.experience_years !== undefined
              ? t('card.experience', { n: p.experience_years })
              : `${t('field.experience')}: ${t('na')}`}
          </p>
        ) : null}

        <p className="provider-line muted">
          <span aria-hidden="true">📍</span> {place || `${t('field.address')}: ${t('na')}`}
        </p>

        <p className="provider-line">
          {p.verified_phone ? (
            <>
              <span className="muted">{t('field.verifiedPhone')}: </span>
              <a className="strong" href={telHref(p.verified_phone)}>
                {p.verified_phone}
              </a>
            </>
          ) : (
            <span className="muted">{t('field.phoneUnverified')}</span>
          )}
        </p>
      </div>

      <div className="provider-side">
        <ContactActions compact />
        <Link className="btn btn-primary" to={`/provider/${p.id}`}>
          {t('card.view')}
        </Link>
      </div>
    </article>
  );
}
