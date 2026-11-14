import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import About from './pages/About.jsx';
import Directory from './pages/Directory.jsx';
import Home from './pages/Home.jsx';
import NotFound from './pages/NotFound.jsx';
import OrderMedicine from './pages/OrderMedicine.jsx';
import TrackOrder from './pages/TrackOrder.jsx';
import ProviderDetail from './pages/ProviderDetail.jsx';

// The admin area is loaded only when the owner visits it.
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin.jsx'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout.jsx'));
const AdminListings = lazy(() => import('./pages/admin/AdminListings.jsx'));
const ProviderForm = lazy(() => import('./pages/admin/ProviderForm.jsx'));
const ImportCsv = lazy(() => import('./pages/admin/ImportCsv.jsx'));
const Specialties = lazy(() => import('./pages/admin/Specialties.jsx'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders.jsx'));
const Settings = lazy(() => import('./pages/admin/Settings.jsx'));

const fallback = (
  <div className="container page">
    <p className="status">Loading…</p>
  </div>
);

export default function App() {
  return (
    <Suspense fallback={fallback}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="doctors" element={<Directory key="doctor" type="doctor" />} />
          <Route path="labs" element={<Directory key="lab" type="lab" />} />
          <Route path="pharmacies" element={<Directory key="pharmacy" type="pharmacy" />} />
          <Route path="provider/:id" element={<ProviderDetail />} />
          <Route path="order" element={<OrderMedicine />} />
          <Route path="track" element={<TrackOrder />} />
          <Route path="about" element={<About />} />
          <Route path="admin/login" element={<AdminLogin />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<AdminListings />} />
          <Route path="new" element={<ProviderForm key="new" />} />
          <Route path="edit/:id" element={<ProviderForm />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="import" element={<ImportCsv />} />
          <Route path="specialties" element={<Specialties />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
