import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Award,
  RefreshCw,
  ChevronDown,
  ShieldCheck,
  Briefcase,
} from 'lucide-react';
import api from '../lib/api';

// ─── Constants ────────────────────────────────────────────────
const TABS = [
  { key: 'member', label: 'Members', icon: Users, accent: '#10b981' },
  { key: 'sbm',    label: 'SBMs',    icon: ShieldCheck, accent: '#3b82f6' },
  { key: 'ebm',    label: 'EBMs',    icon: Briefcase,   accent: '#8b5cf6' },
];

const ROLE_OPTIONS = [
  { value: 'member', label: 'Member' },
  { value: 'sbm',    label: 'SBM — Student Body Member' },
  { value: 'ebm',    label: 'EBM — Executive Body Member' },
  { value: 'admin',  label: 'Admin' },
  { value: 'guest',  label: 'Guest' },
];

const DOMAIN_OPTIONS = ['Tech', 'Marketing', 'Editing', 'Documentation'];

// ── Role Badge ─────────────────────────────────────────────────
const RoleBadge = ({ role }) => {
  const styles = {
    admin:  'bg-red-50 text-red-600 border-red-100',
    ebm:    'bg-purple-50 text-purple-600 border-purple-100',
    sbm:    'bg-blue-50 text-blue-600 border-blue-100',
    member: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    guest:  'bg-slate-100 text-slate-500 border-slate-200',
  };
  const labels = { admin: 'Admin', ebm: 'EBM', sbm: 'SBM', member: 'Member', guest: 'Guest' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[role] || styles.guest}`}>
      {labels[role] || role}
    </span>
  );
};

// ── Toast ─────────────────────────────────────────────────────
const Toast = ({ toast }) => {
  if (!toast) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 max-w-sm w-full p-4 rounded-xl shadow-2xl border
      ${toast.type === 'success' ? 'bg-white border-emerald-200 text-emerald-700' : 'bg-white border-red-200 text-red-600'}`}
    >
      {toast.type === 'success'
        ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
        : <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
      }
      <p className="text-sm font-semibold">{toast.message}</p>
    </div>
  );
};

// ── Role Change Dropdown ──────────────────────────────────────
const RoleChangeDropdown = ({ user, onRoleChange, isUpdating }) => (
  <div className="relative inline-block w-52">
    <select
      value={user.role}
      onChange={(e) => onRoleChange(user._id, e.target.value)}
      disabled={isUpdating}
      className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer pr-8 disabled:opacity-50"
    >
      {ROLE_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
      {isUpdating
        ? <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />
        : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      }
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// ADMIN USERS PAGE
// ─────────────────────────────────────────────────────────────
const AdminUsers = () => {
  const [activeTab, setActiveTab] = useState('member');
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Fetch all users at once, filter client-side per tab ───
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users');
      setAllUsers(res.data.data.users || []);
    } catch (err) {
      console.error('[AdminUsers] Fetch failed:', err.message);
      showToast('Failed to load user directory.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── Handle role change ────────────────────────────────────
  const handleRoleChange = async (userId, newRole) => {
    setUpdatingId(userId);
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      setAllUsers((prev) => prev.map((u) => u._id === userId ? { ...u, role: newRole } : u));
      showToast(`Role updated to ${newRole.toUpperCase()}.`, 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Role update failed.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Tab filtering ─────────────────────────────────────────
  const tabUsers = allUsers.filter((u) => u.role === activeTab);

  // ── Search filtering ──────────────────────────────────────
  const filtered = tabUsers.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.aceId?.toLowerCase().includes(q) ||
      u.registrationNumber?.toLowerCase().includes(q) ||
      u.branch?.toLowerCase().includes(q)
    );
  });

  // ── Tab counts ─────────────────────────────────────────────
  const counts = {
    member: allUsers.filter((u) => u.role === 'member').length,
    sbm:    allUsers.filter((u) => u.role === 'sbm').length,
    ebm:    allUsers.filter((u) => u.role === 'ebm').length,
  };

  const isBodyMemberTab = activeTab === 'sbm' || activeTab === 'ebm';
  const activeTabConfig = TABS.find((t) => t.key === activeTab);

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      <Toast toast={toast} />

      {/* ── Page Header ─────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">User Directory</h1>
          <p className="text-sm text-slate-500 mt-1">{allUsers.length} total accounts in system</p>
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 bg-white border border-slate-200 hover:border-blue-200 rounded-xl px-4 py-2.5 transition-all shadow-sm cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── Tabs ─────────────────────────────────────── */}
      <div className="flex items-center gap-1 mb-6 bg-slate-100 rounded-xl p-1 w-fit">
        {TABS.map(({ key, label, icon: Icon, accent }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => { setActiveTab(key); setSearch(''); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer
                ${isActive ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              style={isActive ? { color: accent } : {}}
            >
              <Icon className="w-4 h-4" style={isActive ? { color: accent } : {}} />
              {label}
              <span className={`text-xs font-black px-1.5 py-0.5 rounded-full
                ${isActive ? 'bg-slate-100 text-slate-600' : 'bg-slate-200 text-slate-500'}`}>
                {counts[key]}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Table Container ──────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Search + Table Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            {activeTabConfig && (
              <activeTabConfig.icon
                className="w-4 h-4"
                style={{ color: activeTabConfig.accent }}
              />
            )}
            <span className="text-sm font-bold text-slate-700">{activeTabConfig?.label}</span>
            <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
              {filtered.length}
            </span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, email, ACE ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 font-medium"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="text-sm font-semibold text-slate-400">Loading user directory...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
            <Users className="w-10 h-10 opacity-30" />
            <p className="text-sm font-semibold">
              {search ? 'No users match your search.' : `No ${TABS.find(t => t.key === activeTab)?.label} found.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Member</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">ACE ID</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Reg. No.</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Branch / Sec.</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Year</th>
                  {isBodyMemberTab && (
                    <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Domain</th>
                  )}
                  {activeTab === 'ebm' && (
                    <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Designation</th>
                  )}
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Promote / Change Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Member Info */}
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 text-sm">{user.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{user.email}</div>
                    </td>

                    {/* ACE ID */}
                    <td className="px-5 py-4">
                      {user.aceId ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-blue-50 text-blue-700 border border-blue-100">
                          <Award className="w-3 h-3" />
                          {user.aceId}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>

                    {/* Registration Number */}
                    <td className="px-5 py-4">
                      {user.registrationNumber ? (
                        <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded">
                          {user.registrationNumber}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>

                    {/* Branch / Section */}
                    <td className="px-5 py-4">
                      {user.branch ? (
                        <div>
                          <span className="text-sm font-bold text-slate-700">{user.branch}</span>
                          {user.section && (
                            <span className="text-xs text-slate-400 ml-1">/ {user.section}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>

                    {/* Year */}
                    <td className="px-5 py-4 text-sm text-slate-500 font-medium">
                      {user.year ? `Year ${user.year}` : '—'}
                    </td>

                    {/* Domain (SBM / EBM only) */}
                    {isBodyMemberTab && (
                      <td className="px-5 py-4">
                        {user.domain ? (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                            {user.domain}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                    )}

                    {/* Designation (EBM only) */}
                    {activeTab === 'ebm' && (
                      <td className="px-5 py-4">
                        {user.designation ? (
                          <span className="text-sm font-semibold text-purple-600">{user.designation}</span>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                    )}

                    {/* Role Badge */}
                    <td className="px-5 py-4">
                      <RoleBadge role={user.role} />
                    </td>

                    {/* Role Change Dropdown */}
                    <td className="px-5 py-4">
                      <RoleChangeDropdown
                        user={user}
                        onRoleChange={handleRoleChange}
                        isUpdating={updatingId === user._id}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
