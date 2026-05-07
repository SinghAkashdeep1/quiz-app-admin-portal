import axios from 'axios';

const getBaseURL = () => {
  const envURL = process.env.NEXT_PUBLIC_API_URL;
  if (envURL && envURL !== 'auto') return envURL.replace('/api', '');

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `http://${hostname}:5000`;
    }
  }

  return 'http://localhost:5000';
};

export const BASE_URL = getBaseURL();

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
});

export const getMediaURL = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

// Add a request interceptor to add the auth token to every request
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  const lang = typeof window !== 'undefined' ? localStorage.getItem('i18nextLng') || 'en' : 'en';

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  config.headers['Accept-Language'] = lang;
  
  return config;
});

// Add a response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        // Only redirect if not already on login page to prevent page reload on failed login
        if (window.location.pathname !== '/login') {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUsername');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
