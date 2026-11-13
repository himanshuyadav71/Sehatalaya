import { Link } from 'react-router-dom';
import { useLang } from '../lib/i18n.jsx';

export default function NotFound() {
  const { t } = useLang();
  return (
    <div className="container page">
      <div className="empty card">
        <h1>{t('notfound.title')}</h1>
        <p className="muted">{t('notfound.body')}</p>
        <Link className="btn btn-primary" to="/">
          {t('notfound.home')}
        </Link>
      </div>
    </div>
  );
}
