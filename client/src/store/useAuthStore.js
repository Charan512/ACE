import { create } from 'zustand';
import api from '../lib/api';

/**
 * Zustand store for Authentication state.
 *
 * Manages the JWT token, current user profile, and app initialization state.
 * All auth side-effects (localStorage, API calls) live here — components
 * are completely decoupled from the auth mechanism.
 *
 * State shape:
 *   user            — Full user profile object from /auth/me, or null
 *   token           — Raw JWT string, synced from localStorage on boot
 *   isAuthenticated — Derived boolean: true when a verified user exists
 *   isLoading       — True during the initial token-verification call on mount
 */
const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('ace_token') || null,
  isAuthenticated: false,           // Always false until fetchProfile succeeds
  isLoading: !!localStorage.getItem('ace_token'), // Skip load spinner if no token

  // ── login ────────────────────────────────────────────────
  /**
   * Calls POST /api/auth/login, stores the returned JWT, and hydrates state.
   * Throws so the calling component can catch and display the error.
   *
   * @param {string} email
   * @param {string} password
   * @returns {Object} user — caller uses role to decide redirect target
   */
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, data } = response.data;
    const user = data.user;

    localStorage.setItem('ace_token', token);
    set({ token, user, isAuthenticated: true, isLoading: false });

    return user; // Caller uses user.role for redirect decision
  },

  // ── logout ───────────────────────────────────────────────
  /**
   * Clears all auth state and removes the token from localStorage.
   * Safe to call even if the user is already logged out.
   */
  logout: () => {
    localStorage.removeItem('ace_token');
    set({ token: null, user: null, isAuthenticated: false, isLoading: false });
  },

  // ── fetchProfile ─────────────────────────────────────────
  /**
   * Called once on app mount (from App.jsx useEffect).
   * Validates the stored token against the live /auth/me endpoint.
   *
   * If the token is missing or the server rejects it (expired / revoked),
   * logout() is called to wipe stale state before the UI renders.
   *
   * If valid, hydrates `user` and sets `isAuthenticated: true` so
   * ProtectedRoute renders the outlet instead of redirecting.
   */
  fetchProfile: async () => {
    const { token, logout } = get();

    if (!token) {
      set({ isLoading: false });
      return;
    }

    try {
      set({ isLoading: true });
      const response = await api.get('/auth/me');
      const user = response.data.data.user;

      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      // Token invalid or expired — the axios interceptor already dispatched
      // 'auth:unauthorized' which triggers the listener below. Ensure clean state.
      console.warn('[AuthStore] Token validation failed:', error.message);
      logout();
    }
  },

  // ── changePassword ───────────────────────────────────────
  /**
   * Calls POST /api/auth/change-password with currentPassword and newPassword.
   * Updates state with the returned new token and user object.
   *
   * @param {string} currentPassword
   * @param {string} newPassword
   * @returns {Object} user — updated user profile object
   */
  changePassword: async (currentPassword, newPassword) => {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    const { token, data } = response.data;
    const user = data.user;

    localStorage.setItem('ace_token', token);
    set({ token, user, isAuthenticated: true, isLoading: false });

    return user;
  },
}));

// ── Global 401 listener ──────────────────────────────────────
// When the axios response interceptor fires 'auth:unauthorized' (any 401 from
// any API call), wipe auth state immediately — no infinite redirect loops.
if (typeof window !== 'undefined') {
  window.addEventListener('auth:unauthorized', () => {
    useAuthStore.getState().logout();
  });
}

export default useAuthStore;
