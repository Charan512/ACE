import { create } from 'zustand';
import api from '../lib/api';

/**
 * Zustand store for Authentication state.
 * Manages the JWT token, the current user profile, and initialization state.
 */
const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('ace_token') || null,
  isAuthenticated: !!localStorage.getItem('ace_token'),
  isLoading: true, // True initially until we verify the token with the backend

  login: (token, user) => {
    localStorage.setItem('ace_token', token);
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('ace_token');
    set({ token: null, user: null, isAuthenticated: false });
  },

  // Fetches the user profile from the backend using the current token
  fetchProfile: async () => {
    const { token, logout } = get();
    if (!token) {
      set({ isLoading: false });
      return;
    }

    try {
      set({ isLoading: true });
      // The backend route for profile fetching is typically GET /api/auth/me
      // Note: We haven't implemented the auth routes yet (Phase 7), so this will fail for now.
      const response = await api.get('/auth/me');
      set({ 
        user: response.data.data.user, 
        isAuthenticated: true, 
        isLoading: false 
      });
    } catch (error) {
      console.error('[AuthStore] Failed to fetch profile:', error.message);
      // If token is invalid/expired, the api interceptor will dispatch 'auth:unauthorized'
      // But we can also proactively clear it here if the request fails
      logout();
      set({ isLoading: false });
    }
  }
}));

// Listen for global unauthorized events emitted by the axios interceptor
if (typeof window !== 'undefined') {
  window.addEventListener('auth:unauthorized', () => {
    useAuthStore.getState().logout();
  });
}

export default useAuthStore;
