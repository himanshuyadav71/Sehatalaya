import { useEffect } from 'react';
import { useLang } from '../lib/i18n.jsx';
import { useSettings } from '../lib/settings.jsx';

export default function About() {
  const { t } = useLang();
  const { settings } = useSettings();
  const email = String(settings.contact_email || '').trim();

  useEffect(() => {
    document.title = `${t('about.title')} — ${t('brand')}`;
  }, [t]);

  return (
    <div className="container page prose">
      <h1 className="page-title">{t('about.title')}</h1>
      <p className="lead">{t('about.meaning')}</p>
      <p>{t('about.body1')}</p>
      <p>{t('about.body2')}</p>
      <p>{t('about.body3')}</p>

      <h2>{t('about.providers')}</h2>
      <p>{t('about.providersBody')}</p>

      <h2>{t('about.contact')}</h2>
      {email ? (
        <p>
          <a href={`mailto:${email}`}>{email}</a>
        </p>
      ) : (
        <p className="muted">{t('about.contactNone')}</p>
      )}

      <h2>{t('about.disclaimerTitle')}</h2>
      <p>{t('about.disclaimerBody')}</p>

      <h2>{t('about.privacyTitle')}</h2>
      <p>{t('about.privacyBody')}</p>
    </div>
  );
}
