import { useAuthStore } from '@/store/auth';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

/**
 * Thin fetch wrapper with auth header injection + unified error handling.
 */
async function request(path, { method = 'GET', body, headers = {}, raw = false } = {}) {
  const token = useAuthStore.getState().token;
  const opts = {
    method,
    headers: {
      ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  };
  if (body) opts.body = body instanceof FormData ? body : JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);

  if (res.status === 401) {
    useAuthStore.getState().logout();
  }

  if (raw) return res;

  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    const err = new Error(json.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.details = json.details;
    throw err;
  }
  return json;
}

const toQuery = (params = {}) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.append(k, v);
  });
  const s = q.toString();
  return s ? `?${s}` : '';
};

export const api = {
  get: (path, params) => request(`${path}${toQuery(params)}`),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  del: (path) => request(path, { method: 'DELETE' }),
  upload: (path, formData) => request(path, { method: 'POST', body: formData }),
  raw: (path, opts) => request(path, { ...opts, raw: true }),
  baseUrl: BASE,
};
