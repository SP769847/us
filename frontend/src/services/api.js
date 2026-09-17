import axios from 'axios';
import { isAgeConfirmed } from '../utils/questionCategories.js';

// In dev, VITE_API_URL is unset and Vite's proxy forwards relative "/api" to
// the local backend (see vite.config.js). In production (Vercel), the backend
// lives on a different domain (Render), so VITE_API_URL must be set to its
// full URL, e.g. https://your-backend.onrender.com
const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// The Naughty 18+ question category is gated both client-side (age gate
// modal, see utils/questionCategories.js) and server-side (this header) —
// the backend refuses NAUGHTY_18 content without it.
api.interceptors.request.use((config) => {
  if (isAgeConfirmed()) {
    config.headers['X-Age-Confirmed'] = 'true';
  }
  return config;
});

export function extractErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  return err?.response?.data?.error || fallback;
}

export default api;
