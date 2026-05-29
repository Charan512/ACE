import axios from 'axios';

// Create a configured axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT token to every request if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ace_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401s globally (e.g. expired token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the server says we're unauthorized, clear the token so the app logs out
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('ace_token');
      // We do not window.location.href here to avoid hard reloads,
      // the AuthContext will handle the state update upon detecting missing token on next mount,
      // or we can dispatch a custom event.
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default api;
