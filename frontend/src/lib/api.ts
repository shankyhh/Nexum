import axios from 'axios';

// In production (Vercel), VITE_API_URL must point to the Render backend.
// In development, Vite proxy forwards /api → localhost:5000.
const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : '/api/v1';

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nexum_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('nexum_token');
      localStorage.removeItem('nexum_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
