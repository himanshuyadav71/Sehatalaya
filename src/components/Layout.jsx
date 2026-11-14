import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useLang } from '../lib/i18n.jsx';
import { useSettings } from '../lib/settings.jsx';
import { isConfigured } from '../lib/supabase.js';
import { LanguageToggle, ThemeToggle } from './Toggles.jsx';

function Logo() {
  return (
    <svg className="logo-mark" viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="currentColor" />
      <path d="M32 12 12 28v24h14V38h12v14h14V28z" fill="#fff" />
      <path d="M29 22h6v5h5v6h-5v5h-6v-5h-5v-6h5z" fill="currentColor" />
    </svg>
  );
}

export default function Layout() {
  const { t, pick } = useLang();
  const { settings } = useSettings();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const announcement = pick(settings.announcement_en, settings.announcement_hi);
  const contactEmail = String(settings.contact_email || '').trim();
  const links = [
    ['/', t('nav.home')],
    ['/doctors', t('nav.doctors')],
    ['/labs', t('nav.labs')],
    ['/pharmacies', t('nav.pharmacies')],
    ['/order', t('nav.order')],
    ['/about', t('nav.about')],
  ];

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      {announcement ? <div className="announcement">{announcement}</div> : null}

      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="brand" aria-label="Sehatalay — home">
            <Logo />
            <span className="brand-text">
              <span className="brand-name">{t('brand')}</span>
              <span className="brand-tag">{t('tagline')}</span>
            </span>
          </Link>

          <nav id="site-nav" className={`site-nav${open ? ' open' : ''}`}>
            {links.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === '/'}>
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="header-tools">
            <LanguageToggle />
            <ThemeToggle />
          </div>

          <button
            type="button"
            className="menu-toggle"
            aria-expanded={open}
            aria-controls="site-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {t('nav.menu')}
          </button>
        </div>
      </header>

      <main id="main" className="site-main">
        {!isConfigured ? (
          <div className="container">
            <div className="notice notice-warn" role="alert">
              <strong>{t('setup.title')}</strong>
              <p>{t('setup.body')}</p>
            </div>
          </div>
        ) : null}
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <div>
            <div className="footer-brand">{t('footer.rights')}</div>
            <div className="muted">{t('city')}</div>
          </div>
          <p className="footer-note">
            {t('footer.disclaimer')} {t('footer.free')}
            {contactEmail ? (
              <>
                <br />
                {t('cta.list')} <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
              </>
            ) : null}
          </p>
          <nav className="footer-links" aria-label="Footer">
            <Link to="/doctors">{t('nav.doctors')}</Link>
            <Link to="/labs">{t('nav.labs')}</Link>
            <Link to="/pharmacies">{t('nav.pharmacies')}</Link>
            <Link to="/order">{t('nav.order')}</Link>
            <Link to="/track">{t('nav.track')}</Link>
            <Link to="/about">{t('nav.about')}</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
