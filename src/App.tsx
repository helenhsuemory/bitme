/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import ToastContainer from './components/Toast';
import PublicProfile from './pages/PublicProfile';
import Login from './pages/Login';
import AdminLayout from './layouts/AdminLayout';
import DashboardOverview from './pages/admin/DashboardOverview';
import MyLinks from './pages/admin/MyLinks';
import Services from './pages/admin/Services';
import Availability from './pages/admin/Availability';
import Bookings from './pages/admin/Bookings';
import Settings from './pages/admin/Settings';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicProfile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<DashboardOverview />} />
            <Route path="links" element={<MyLinks />} />
            <Route path="services" element={<Services />} />
            <Route path="availability" element={<Availability />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer />
      </BrowserRouter>
    </AppProvider>
  );
}
