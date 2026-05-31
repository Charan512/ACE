import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import useAuthStore from './store/useAuthStore';

// Pages
import GuestPortal from './pages/GuestPortal';
import EventsPage from './pages/EventsPage';
import TeamDirectory from './pages/TeamDirectory';
import Registration from './pages/Registration';
import Login from './pages/Login';
import MemberDashboard from './pages/MemberDashboard';
import GuestCheckout from './pages/GuestCheckout';
import EventDetailPage from './pages/EventDetailPage';
import AdminDashboard from './pages/AdminDashboard';
import ForcePasswordChange from './pages/ForcePasswordChange';

// Layout with Navbar
const MainLayout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
};

// Admin Layout (no navbar — specialized command-bar header lives inside AdminDashboard)
const AdminLayout = () => {
  return (
    <>
      <Outlet />
    </>
  );
};

function App() {
  const fetchProfile = useAuthStore((state) => state.fetchProfile);

  /**
   * On every cold mount, validate the stored JWT against /api/auth/me.
   * ProtectedRoute reads `isLoading` and renders a spinner while this resolves,
   * so the user is never flashed to /login while the token is still being verified.
   */
  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<GuestPortal />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:eventId" element={<EventDetailPage />} />
          <Route path="/team" element={<TeamDirectory />} />
          <Route path="/register" element={<Registration />} />
          <Route path="/login" element={<Login />} />
          <Route path="/events/checkout/:eventId" element={<GuestCheckout />} />

          {/* Protected Member Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<MemberDashboard />} />
          </Route>

          {/* Force Password Change Route */}
          <Route element={<ProtectedRoute allowPasswordChangePending={true} />}>
            <Route path="/force-password-change" element={<ForcePasswordChange />} />
          </Route>
        </Route>

        {/* Protected Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin', 'body_member']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
