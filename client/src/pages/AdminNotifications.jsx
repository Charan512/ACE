import { useState, useEffect, useCallback } from 'react';
import {
  Bell, CheckCircle2, Loader2, RefreshCw, AlertTriangle,
  DollarSign, User, Calendar, ChevronDown,
} from 'lucide-react';
import api from '../lib/api';

// ── Notification Card ─────────────────────────────────────────
const NotifCard = ({ notif, onMarkRead }) => {
  const isRead = notif.isRead;
  const createdAt = new Date(notif.createdAt).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className={`clay-card flex items-start gap-4 p-5 transition-all ${
      isRead ? 'clay-slate' : 'clay-pink'
    }`}>
      {/* Icon */}
      <div className={`clay-icon-box w-10 h-10 ${
        isRead ? '' : ''
      }`} style={{ background: isRead ? '#f1f5f9' : '#dbeafe' }}>
        <DollarSign className={`w-5 h-5 ${isRead ? 'text-slate-400' : 'text-blue-600'}`} />
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-bold ${isRead ? 'text-slate-600' : 'text-slate-900'}`}>
            {notif.message || 'Cash registration received.'}
          </p>
          {!isRead && (
            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
          )}
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
          {notif.registrantName && (
            <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
              <User className="w-3 h-3" /> {notif.registrantName}
            </span>
          )}
          {notif.eventTitle && (
            <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
              <Calendar className="w-3 h-3" /> {notif.eventTitle}
            </span>
          )}
          {notif.amount != null && (
            <span className="clay-badge" style={{ background: '#d1fae5', color: '#059669', borderColor: '#a7f3d0' }}>
              {String.fromCodePoint(0x20B9)}{notif.amount}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-[11px] text-slate-400 font-mono">{createdAt}</span>
          {!isRead && (
            <button
              onClick={() => onMarkRead(notif._id)}
              className="clay-btn clay-btn-blue text-[11px] px-3 py-1"
            >
              Mark as read
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// ADMIN NOTIFICATIONS PAGE
// ─────────────────────────────────────────────────────────────
const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = filter === 'unread' ? '?unreadOnly=true' : '';
      const res = await api.get(`/admin/notifications${params}`);
      setNotifications(res.data.data?.notifications || []);
    } catch (err) {
      console.error('[AdminNotifications] Fetch failed:', err.message);
      setError('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleMarkRead = async (notifId) => {
    try {
      await api.patch(`/admin/notifications/${notifId}/read`);
      setNotifications((prev) =>
        prev.map((n) => n._id === notifId ? { ...n, isRead: true } : n)
      );
    } catch (err) {
      console.error('[AdminNotifications] Mark read failed:', err.message);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await api.patch('/admin/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('[AdminNotifications] Mark all read failed:', err.message);
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-5 h-5 text-slate-600" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Notifications</h1>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full ml-1">
                {unreadCount}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">Cash registration alerts and system events</p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={fetchNotifications} disabled={loading}
            className="clay-btn clay-btn-ghost p-2.5">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} disabled={markingAll}
              className="clay-btn clay-btn-blue flex items-center gap-1.5 text-sm px-4 py-2">
              {markingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 clay-card clay-indigo rounded-xl mb-6 w-fit">
        {['all', 'unread'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all cursor-pointer capitalize ${
              filter === f
                ? 'clay-btn clay-btn-blue shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}>
            {f}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="text-sm font-semibold text-slate-400">Loading notifications...</span>
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 p-5 rounded-2xl bg-red-50 border border-red-100 text-red-600">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
          <Bell className="w-10 h-10 opacity-30" />
          <p className="text-sm font-semibold">
            {filter === 'unread' ? 'No unread notifications.' : 'No notifications yet.'}
          </p>
          <p className="text-xs font-mono">Cash registrations from the Ops team will appear here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map((notif) => (
            <NotifCard key={notif._id} notif={notif} onMarkRead={handleMarkRead} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;
