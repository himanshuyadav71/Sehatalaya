import { useEffect, useRef } from 'react';
import { useLang } from '../lib/i18n.jsx';
import { useSettings } from '../lib/settings.jsx';

// Google AdSense integration — READY BUT DISABLED.
//
// Nothing is rendered and no Google script is loaded unless the owner has
// (1) switched "adsense_enabled" on and (2) saved a valid publisher ID
// (ca-pub-…) in Admin → Settings. Do this only after AdSense approval.
const CLIENT_PATTERN = /^ca-pub-\d{10,20}$/;

function loadScript(client) {
  if (document.querySelector('script[data-sehatalaya-adsense]')) return;
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
  s.crossOrigin = 'anonymous';
  s.dataset.sehatalayaAdsense = 'true';
  document.head.appendChild(s);
}

export default function AdSlot({ slot = '' }) {
  const { t } = useLang();
  const { settings } = useSettings();
  const pushed = useRef(false);

  const client = String(settings.adsense_client || '').trim();
  const enabled = settings.adsense_enabled === true && CLIENT_PATTERN.test(client);

  useEffect(() => {
    if (!enabled || pushed.current) return;
    loadScript(client);
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      /* ad blocker or script not ready */
    }
  }, [enabled, client]);

  if (!enabled) return null;

  return (
    <aside className="ad-slot" aria-label={t('ad.label')}>
      <span className="ad-label">{t('ad.label')}</span>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={client}
        data-ad-slot={slot || undefined}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
