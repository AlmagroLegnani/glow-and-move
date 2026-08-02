const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function request(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Ocurrió un error inesperado');
  }
  return data;
}

export const api = {
  register: (body) => request('/api/auth/register', { method: 'POST', body }),
  login: (body) => request('/api/auth/login', { method: 'POST', body }),
  forgotPassword: (body) => request('/api/auth/forgot-password', { method: 'POST', body }),
  resetPassword: (body) => request('/api/auth/reset-password', { method: 'POST', body }),
  me: (token) => request('/api/auth/me', { token }),
  updateMe: (body, token) => request('/api/auth/me', { method: 'PATCH', body, token }),
  plans: () => request('/api/plans'),
  startTrial: (body) => request('/api/trial', { method: 'POST', body }),
  checkout: (body, token) => request('/api/subscriptions/checkout', { method: 'POST', body, token }),
  changePlan: (body, token) => request('/api/subscriptions/change-plan', { method: 'POST', body, token }),
  contact: (body) => request('/api/contact', { method: 'POST', body }),
  submitHealthProfile: (body, token) => request('/api/health-profile', { method: 'POST', body, token }),
  myVideos: (token) => request('/api/videos', { token }),
};

export { API_URL };
