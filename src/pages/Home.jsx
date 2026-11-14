import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdSlot from '../components/AdSlot.jsx';
import { ORGANS } from '../lib/constants.js';
import { useLang } from '../lib/i18n.jsx';

export default function Home() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  useEffect(() => {
    document.title = `${t('brand')} — ${t('tagline')} | ${t('city')}`;
  }, [t]);

  const categories = [
    { to: '/doctors', icon: '🩺', title: t('nav.doctors'), desc: t('home.doctorsDesc') },
    { to: '/labs', icon: '🔬', title: t('nav.labs'), desc: t('home.labsDesc') },
    { to: '/pharmacies', icon: '💊', title: t('nav.pharmacies'), desc: t('home.pharmaciesDesc') },
    { to: '/order', icon: '🛵', title: t('nav.order'), desc: t('home.orderDesc') },
  ];

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <p className="hero-eyebrow">
            {t('brand')} · {t('tagline')} · {t('city')}
          </p>
          <h1>{t('home.title')}</h1>
          <p className="hero-sub">{t('home.subtitle')}</p>

          <form
            className="hero-search"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              const term = q.trim();
              navigate(term ? `/doctors?q=${encodeURIComponent(term)}` : '/doctors');
            }}
          >
            <label className="sr-only" htmlFor="home-search">
              {t('home.searchPlaceholder')}
            </label>
            <input
              id="home-search"
              type="search"
              value={q}
              maxLength={80}
              placeholder={t('home.searchPlaceholder')}
              onChange={(e) => setQ(e.target.value)}
            />
            <button type="submit" className="btn btn-accent">
              {t('home.search')}
            </button>
          </form>
        </div>
      </section>

      <div className="container page">
        <section>
          <h2 className="section-heading">{t('home.categories')}</h2>
          <div className="category-grid">
            {categories.map((c) => (
              <Link key={c.to} to={c.to} className="card category-card">
                <span className="category-icon" aria-hidden="true">
                  {c.icon}
                </span>
                <span className="category-title">{c.title}</span>
                <span className="muted">{c.desc}</span>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="section-heading">{t('home.browseOrgan')}</h2>
          <div className="organ-grid">
            {ORGANS.map((o) => (
              <Link key={o.key} to={`/doctors?organ=${o.key}`} className="organ-chip">
                <span aria-hidden="true">{o.icon}</span>
                <span>{lang === 'hi' ? o.hi : o.en}</span>
              </Link>
            ))}
          </div>
        </section>

        <AdSlot />

        <section>
          <h2 className="section-heading">{t('home.principles')}</h2>
          <div className="principle-grid">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="card principle">
                <h3>{t(`home.p${n}.title`)}</h3>
                <p className="muted">{t(`home.p${n}.body`)}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
