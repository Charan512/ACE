import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import GuestPortal from './pages/GuestPortal';
import TeamDirectory from './pages/TeamDirectory';
import Login from './pages/Login';
import MemberDashboard from './pages/MemberDashboard';
import AdminDashboard from './pages/AdminDashboard';

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

// Admin Layout (no navbar, purely terminal feel, or a specialized one)
const AdminLayout = () => {
  return (
    <>
      {/* We can put a specialized command bar header here if needed */}
      <Outlet />
    </>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<GuestPortal />} />
          <Route path="/team" element={<TeamDirectory />} />
          <Route path="/login" element={<Login />} />
          
          {/* Protected Member Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<MemberDashboard />} />
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
