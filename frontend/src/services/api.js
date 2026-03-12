import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Injecter le token d'accès sur chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Refresh automatique si 401 TOKEN_EXPIRED
let refreshPromise = null;

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (
      err.response?.status === 401 &&
      err.response?.data?.code === 'TOKEN_EXPIRED' &&
      !original._retry
    ) {
      original._retry = true;
      if (!refreshPromise) {
        refreshPromise = axios.post('/api/auth/refresh', {}, { withCredentials: true })
          .then((res) => {
            const { accessToken } = res.data;
            localStorage.setItem('accessToken', accessToken);
            return accessToken;
          })
          .catch(() => {
            localStorage.removeItem('accessToken');
            window.location.href = '/login';
            return Promise.reject(new Error('Session expirée'));
          })
          .finally(() => { refreshPromise = null; });
      }
      const token = await refreshPromise;
      original.headers.Authorization = `Bearer ${token}`;
      return api(original);
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────
export const authApi = {
  register:   (data) => api.post('/auth/register', data),
  login:      (data) => api.post('/auth/login', data),
  logout:     ()     => api.post('/auth/logout'),
  me:         ()     => api.get('/auth/me'),
  refresh:    ()     => api.post('/auth/refresh'),
  updateProfile: (d) => api.patch('/auth/profile', d),
  changePassword: (d)=> api.patch('/auth/password', d),
};

// ── Vehicles ──────────────────────────────────────────────────
export const vehiclesApi = {
  list:        ()          => api.get('/vehicles'),
  get:         (id)        => api.get(`/vehicles/${id}`),
  create:      (data)      => api.post('/vehicles', data),
  update:      (id, data)  => api.put(`/vehicles/${id}`, data),
  remove:      (id)        => api.delete(`/vehicles/${id}`),
  getShares:   (id)        => api.get(`/vehicles/${id}/shares`),
  addShare:    (id, data)  => api.post(`/vehicles/${id}/shares`, data),
  removeShare: (id, shareId) => api.delete(`/vehicles/${id}/shares/${shareId}`),
};

// ── Trips ─────────────────────────────────────────────────────
export const tripsApi = {
  list:   (vehicleId, params) => api.get(`/vehicles/${vehicleId}/trips`, { params }),
  create: (vehicleId, data)   => api.post(`/vehicles/${vehicleId}/trips`, data),
  update: (vehicleId, id, d)  => api.put(`/vehicles/${vehicleId}/trips/${id}`, d),
  remove: (vehicleId, id)     => api.delete(`/vehicles/${vehicleId}/trips/${id}`),
};

// ── Expenses ──────────────────────────────────────────────────
export const expensesApi = {
  list:   (vehicleId, params) => api.get(`/vehicles/${vehicleId}/expenses`, { params }),
  create: (vehicleId, data)   => api.post(`/vehicles/${vehicleId}/expenses`, data),
  update: (vehicleId, id, d)  => api.put(`/vehicles/${vehicleId}/expenses/${id}`, d),
  remove: (vehicleId, id)     => api.delete(`/vehicles/${vehicleId}/expenses/${id}`),
};

// ── Maintenance ───────────────────────────────────────────────
export const maintenanceApi = {
  list:   (vehicleId, params) => api.get(`/vehicles/${vehicleId}/maintenance`, { params }),
  create: (vehicleId, data)   => api.post(`/vehicles/${vehicleId}/maintenance`, data),
  update: (vehicleId, id, d)  => api.put(`/vehicles/${vehicleId}/maintenance/${id}`, d),
  remove: (vehicleId, id)     => api.delete(`/vehicles/${vehicleId}/maintenance/${id}`),
};

// ── Stats ─────────────────────────────────────────────────────
export const statsApi = {
  dashboard:    ()               => api.get('/stats/dashboard'),
  vehicle:      (id, year)       => api.get(`/stats/vehicles/${id}/stats`, { params: { year } }),
};

export default api;
