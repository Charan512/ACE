import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';
import MemberLayout from './components/MemberLayout';
import useAuthStore from './store/useAuthStore';

// ── Public Pages ─────────────────────────────────────────────
import GuestPortal from './pages/GuestPortal';
import EventsPage from './pages/EventsPage';
import TeamDirectory from './pages/TeamDirectory';
import Registration from './pages/Registration';
import Login from './pages/Login';
import GuestCheckout from './pages/GuestCheckout';
import EventDetailPage from './pages/EventDetailPage';
import ForcePasswordChange from './pages/ForcePasswordChange';
import PaymentCallback from './pages/PaymentCallback';

// ── Member Pages ──────────────────────────────────────────────
import MemberDashboard from './pages/MemberDashboard';
import MemberProfile from './pages/MemberProfile';
import MemberHistory from './pages/MemberHistory';

// ── Admin Pages ───────────────────────────────────────────────
import AdminDashboard from './pages/AdminDashboard';
import AdminEvents from './pages/AdminEvents';
import AdminRegistrations from './pages/AdminRegistrations';
import AdminCertificates from './pages/AdminCertificates';
import AdminUsers from './pages/AdminUsers';

// ── Ops Pages ────────────────────────────────────────────────
import OpsLayout          from './components/OpsLayout';
import OpsDashboard       from './pages/OpsDashboard';
import EventControlRoom   from './pages/EventControlRoom';
import OpsScanner         from './pages/OpsScanner';

// ── Layout with Navbar + Footer ───────────────────────────────
import { Outlet } from 'react-router-dom';

const MainLayout = () => (
  <div className="flex min-h-screen flex-col bg-background">
    <Navbar />
    <div className="flex-1">
      <Outlet />
    </div>
    <Footer />
  </div>
);

// ─────────────────────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────────────────────
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
        {/* ── Public Routes ───────────────────────────── */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<GuestPortal />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:eventId" element={<EventDetailPage />} />
          <Route path="/team" element={<TeamDirectory />} />
          <Route path="/register" element={<Registration />} />
          <Route path="/login" element={<Login />} />
          <Route path="/events/checkout/:eventId" element={<GuestCheckout />} />
          <Route path="/payment/callback" element={<PaymentCallback />} />

          {/* ── Force Password Change ───────────────── */}
          <Route element={<ProtectedRoute allowPasswordChangePending={true} />}>
            <Route path="/force-password-change" element={<ForcePasswordChange />} />
          </Route>
        </Route>

        {/* ── Legacy redirect: /dashboard → /member/dashboard */}
        <Route path="/dashboard" element={<Navigate to="/member/dashboard" replace />} />

        {/* ── Protected Member Routes ──────────────────────────── */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['member', 'sbm', 'ebm']} />
          }
        >
          <Route element={<MemberLayout />}>
            <Route path="/member/dashboard" element={<MemberDashboard />} />
            <Route path="/member/profile"   element={<MemberProfile />} />
            <Route path="/member/history"   element={<MemberHistory />} />
          </Route>
        </Route>

        {/* ── Protected Admin Routes ───────────────────────────── */}
        {/* Access: admin, ebm, sbm — all wrapped inside the sidebar AdminLayout */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['admin', 'ebm', 'sbm']} />
          }
        >
          <Route element={<AdminLayout />}>
            <Route path="/admin"                  element={<AdminDashboard />} />
            <Route path="/admin/events"           element={<AdminEvents />} />
            <Route path="/admin/registrations"    element={<AdminRegistrations />} />
            <Route path="/admin/certificates"     element={<AdminCertificates />} />
            <Route path="/admin/users"            element={<AdminUsers />} />
          </Route>
        </Route>
        {/* ── Protected Ops Routes (EBM/SBM/Admin) ───────────────── */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['admin', 'ebm', 'sbm']} />
          }
        >
          <Route element={<OpsLayout />}>
            <Route path="/ops"                        element={<OpsDashboard />} />
            <Route path="/ops/events/:eventId"        element={<EventControlRoom />} />
          </Route>
          {/* Scanner is full-screen (no OpsLayout chrome) */}
          <Route path="/ops/scan" element={<OpsScanner />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
