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

  // Bloques / rutina / bitácora
  myBlocks: (token) => request('/api/blocks', { token }),
  logDay: (body, token) => request('/api/blocks/day', { method: 'POST', body, token }),
  payBlock: (body, token) => request('/api/blocks/pay', { method: 'POST', body, token }),
  changeBlockBilling: (body, token) => request('/api/blocks/billing-mode', { method: 'POST', body, token }),
  blockStats: (token) => request('/api/blocks/stats', { token }),
  startBlockNewYear: (token) => request('/api/blocks/new-year', { method: 'POST', token }),

  // Administración
  admin: {
    listUsers: (token) => request('/api/admin/users', { token }),
    updateUserRole: (id, body, token) => request(`/api/admin/users/${id}/role`, { method: 'PATCH', body, token }),
    updateSubscriptionStatus: (id, body, token) => request(`/api/admin/subscriptions/${id}/status`, { method: 'PATCH', body, token }),
    listPlans: (token) => request('/api/admin/plans', { token }),
    updatePlan: (id, body, token) => request(`/api/admin/plans/${id}`, { method: 'PATCH', body, token }),
    listBlocks: (token) => request('/api/admin/blocks', { token }),
    updateBlock: (id, body, token) => request(`/api/admin/blocks/${id}`, { method: 'PATCH', body, token }),
    listVideos: (token) => request('/api/admin/videos', { token }),
    createVideo: (body, token) => request('/api/admin/videos', { method: 'POST', body, token }),
    updateVideo: (id, body, token) => request(`/api/admin/videos/${id}`, { method: 'PATCH', body, token }),
    deleteVideo: (id, token) => request(`/api/admin/videos/${id}`, { method: 'DELETE', token }),
    listRoutines: (blockId, token) => request(`/api/admin/blocks/${blockId}/routines`, { token }),
    createRoutine: (body, token) => request('/api/admin/routines', { method: 'POST', body, token }),
    deleteRoutine: (id, token) => request(`/api/admin/routines/${id}`, { method: 'DELETE', token }),
    createRoutineDay: (routineId, body, token) => request(`/api/admin/routines/${routineId}/days`, { method: 'POST', body, token }),
    deleteRoutineDay: (id, token) => request(`/api/admin/routine-days/${id}`, { method: 'DELETE', token }),
    createRoutineExercise: (dayId, body, token) => request(`/api/admin/routine-days/${dayId}/exercises`, { method: 'POST', body, token }),
    updateRoutineExercise: (id, body, token) => request(`/api/admin/routine-exercises/${id}`, { method: 'PATCH', body, token }),
    deleteRoutineExercise: (id, token) => request(`/api/admin/routine-exercises/${id}`, { method: 'DELETE', token }),
  },
};

export { API_URL };
