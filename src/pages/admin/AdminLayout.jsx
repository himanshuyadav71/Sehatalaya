import { useEffect } from 'react';
import { Link, NavLink, Navigate, Outlet } from 'react-router-dom';
import { ThemeToggle } from '../../components/Toggles.jsx';
import { useAuth } from '../../lib/auth.jsx';

// UI gate only. Even if someone bypassed this component, Row Level
// Security would return no rows and reject every write.
export default function AdminLayout() {
  const { isOwner, loading, session, signOut } = useAuth();

  useEffect(() => {
    document.title = 'Admin — Sehatalay';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  if (loading) {
    return (
      <div className="container page">
        <p className="status">Checking access…</p>
      </div>
    );
  }
  if (!isOwner) return <Navigate to="/admin/login" replace />;

  return (
    <div className="admin">
      <header className="admin-header">
        <div className="container admin-header-inner">
          <Link to="/admin" className="admin-brand">
            Sehatalay Admin
          </Link>
          <nav className="admin-nav" aria-label="Admin">
            <NavLink to="/admin" end>
              Listings
            </NavLink>
            <NavLink to="/admin/new">Add provider</NavLink>
            <NavLink to="/admin/import">Import CSV</NavLink>
            <NavLink to="/admin/specialties">Specialties</NavLink>
            <NavLink to="/admin/settings">Settings</NavLink>
          </nav>
          <div className="admin-user">
            <span className="muted small">{session?.user?.email}</span>
            <ThemeToggle />
            <Link to="/" className="btn btn-ghost btn-sm">
              View site
            </Link>
            <button type="button" className="btn btn-outline btn-sm" onClick={signOut}>
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="container page">
        <Outlet />
      </main>
    </div>
  );
}
