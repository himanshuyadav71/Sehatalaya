import { useLang } from '../lib/i18n.jsx';
import { useTheme } from '../lib/theme.jsx';

// One button: Hindi <-> English. The label shows the language you will
// switch TO.
export function LanguageToggle() {
  const { lang, setLang, t } = useLang();
  return (
    <button
      type="button"
      className="toggle-pill"
      onClick={() => setLang(lang === 'hi' ? 'en' : 'hi')}
      aria-label={t('lang.switchLabel')}
      title={t('lang.switchLabel')}
    >
      <span aria-hidden="true">🌐</span>
      <span>{t('lang.switch')}</span>
    </button>
  );
}

// One button: light <-> dark. The label shows the mode you will switch TO.
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLang();
  const toDark = theme !== 'dark';
  const label = t(toDark ? 'theme.toDark' : 'theme.toLight');
  return (
    <button
      type="button"
      className="toggle-pill"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
    >
      <span aria-hidden="true">{toDark ? '🌙' : '☀️'}</span>
      <span className="toggle-label-optional">{t(toDark ? 'theme.dark' : 'theme.light')}</span>
    </button>
  );
}
