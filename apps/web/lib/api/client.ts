/**
 * API client for browser-side requests.
 *
 * Auth strategy (dual-track for compatibility):
 *   • Cookie (httpOnly, set by /api/auth/login and /api/auth/register) — canonical
 *     source for middleware protection and session lifetime.
 *   • localStorage auth_token + Authorization: Bearer header — kept for all API
 *     calls so route handlers work regardless of whether credentials: 'include'
 *     sends the cookie.
 *
 * Both the cookie and localStorage token are set/cleared on login/logout.
 * Do NOT remove localStorage usage until all route handlers migrate to
 * cookie-only auth; it would break Bearer-based API calls.
 */

const API_URL = '/api';

export async function apiClient(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    // Send httpOnly cookie alongside Bearer so API routes and middleware
    // both receive the canonical auth cookie on same-origin requests.
    credentials: 'include',
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const errBody = await response.json();
      if (errBody?.error) message = errBody.error;
    } catch {}
    throw new Error(message);
  }

  return response.json();
}

export const authApi = {
  login: async (credentials: any) => {
    return apiClient('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },
  register: async (data: any) => {
    return apiClient('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  /**
   * Returns the real authenticated user from the server.
   * Replaces the previous mock implementation.
   */
  getUser: async () => {
    return apiClient('/auth/me');
  },
  getTenantConfig: async () => {
    return apiClient('/tenant/config');
  },
  updateTenantConfig: async (data: any) => {
    return apiClient('/tenant/config', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  createProduct: async (data: any) => {
    return apiClient('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  listProducts: async () => {
    return apiClient('/products');
  },
  updateProduct: async (id: string, data: any) => {
    return apiClient(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  deleteProduct: async (id: string) => {
    return apiClient(`/products/${id}`, {
      method: 'DELETE',
    });
  },
  testAI: async (message: string) => {
    return apiClient('/ai/test', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },
};

export const billingApi = {
  getSubscription: async () => {
    return apiClient('/billing/subscription');
  },
  createCheckout: async (plan: string) => {
    return apiClient('/billing/checkout', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    });
  },
};

export const contactsApi = {
  list: async (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiClient(`/contacts${qs}`);
  },
  get: async (id: string) => {
    return apiClient(`/contacts/${id}`);
  },
  create: async (data: { phone: string; name?: string; email?: string; source?: string }) => {
    return apiClient('/contacts', { method: 'POST', body: JSON.stringify(data) });
  },
  update: async (id: string, data: Record<string, unknown>) => {
    return apiClient(`/contacts/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  },
  timeline: async (id: string) => {
    return apiClient(`/contacts/${id}/timeline`);
  },
  duplicates: async (id: string) => {
    return apiClient(`/contacts/${id}/duplicates`);
  },
  merge: async (survivorId: string, mergedId: string) => {
    return apiClient(`/contacts/${survivorId}/merge`, { method: 'POST', body: JSON.stringify({ mergedId }) });
  },
  updateTags: async (id: string, tags: string[]) => {
    return apiClient(`/contacts/${id}/tags`, { method: 'PATCH', body: JSON.stringify({ tags }) });
  },
  analytics: async () => {
    return apiClient('/contacts/analytics');
  },
};

// ─── Clinic / Consultório (Phase 6) ──────────────────────────────────────────

export const clinicApi = {
  getProfile: () => apiClient('/clinic/profile'),
  createProfile: (data: Record<string, unknown>) =>
    apiClient('/clinic/profile', { method: 'POST', body: JSON.stringify(data) }),
  updateProfile: (data: Record<string, unknown>) =>
    apiClient('/clinic/profile', { method: 'PATCH', body: JSON.stringify(data) }),

  listServices: () => apiClient('/clinic/services'),
  getService: (id: string) => apiClient(`/clinic/services/${id}`),
  createService: (data: Record<string, unknown>) =>
    apiClient('/clinic/services', { method: 'POST', body: JSON.stringify(data) }),
  updateService: (id: string, data: Record<string, unknown>) =>
    apiClient(`/clinic/services/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteService: (id: string) =>
    apiClient(`/clinic/services/${id}`, { method: 'DELETE' }),

  listProfessionals: () => apiClient('/clinic/professionals'),
  getProfessional: (id: string) => apiClient(`/clinic/professionals/${id}`),
  createProfessional: (data: Record<string, unknown>) =>
    apiClient('/clinic/professionals', { method: 'POST', body: JSON.stringify(data) }),
  updateProfessional: (id: string, data: Record<string, unknown>) =>
    apiClient(`/clinic/professionals/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteProfessional: (id: string) =>
    apiClient(`/clinic/professionals/${id}`, { method: 'DELETE' }),

  listAvailability: () => apiClient('/clinic/availability'),
  createAvailability: (data: Record<string, unknown>) =>
    apiClient('/clinic/availability', { method: 'POST', body: JSON.stringify(data) }),
  updateAvailability: (id: string, data: Record<string, unknown>) =>
    apiClient(`/clinic/availability/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteAvailability: (id: string) =>
    apiClient(`/clinic/availability/${id}`, { method: 'DELETE' }),

  listAppointmentRequests: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiClient(`/clinic/appointment-requests${qs}`);
  },
  getAppointmentRequest: (id: string) => apiClient(`/clinic/appointment-requests/${id}`),
  updateAppointmentRequest: (id: string, data: Record<string, unknown>) =>
    apiClient(`/clinic/appointment-requests/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

// ─── Restaurant / Restaurante (Phase 6) ──────────────────────────────────────

export const restaurantApi = {
  getProfile: () => apiClient('/restaurant/profile'),
  createProfile: (data: Record<string, unknown>) =>
    apiClient('/restaurant/profile', { method: 'POST', body: JSON.stringify(data) }),
  updateProfile: (data: Record<string, unknown>) =>
    apiClient('/restaurant/profile', { method: 'PATCH', body: JSON.stringify(data) }),

  listCategories: () => apiClient('/restaurant/categories'),
  getCategory: (id: string) => apiClient(`/restaurant/categories/${id}`),
  createCategory: (data: Record<string, unknown>) =>
    apiClient('/restaurant/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id: string, data: Record<string, unknown>) =>
    apiClient(`/restaurant/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteCategory: (id: string) =>
    apiClient(`/restaurant/categories/${id}`, { method: 'DELETE' }),

  listProducts: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiClient(`/restaurant/products${qs}`);
  },
  getProduct: (id: string) => apiClient(`/restaurant/products/${id}`),
  createProduct: (data: Record<string, unknown>) =>
    apiClient('/restaurant/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: Record<string, unknown>) =>
    apiClient(`/restaurant/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteProduct: (id: string) =>
    apiClient(`/restaurant/products/${id}`, { method: 'DELETE' }),

  listAddonGroups: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiClient(`/restaurant/addon-groups${qs}`);
  },
  getAddonGroup: (id: string) => apiClient(`/restaurant/addon-groups/${id}`),
  createAddonGroup: (data: Record<string, unknown>) =>
    apiClient('/restaurant/addon-groups', { method: 'POST', body: JSON.stringify(data) }),
  updateAddonGroup: (id: string, data: Record<string, unknown>) =>
    apiClient(`/restaurant/addon-groups/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteAddonGroup: (id: string) =>
    apiClient(`/restaurant/addon-groups/${id}`, { method: 'DELETE' }),

  listAddonOptions: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiClient(`/restaurant/addon-options${qs}`);
  },
  getAddonOption: (id: string) => apiClient(`/restaurant/addon-options/${id}`),
  createAddonOption: (data: Record<string, unknown>) =>
    apiClient('/restaurant/addon-options', { method: 'POST', body: JSON.stringify(data) }),
  updateAddonOption: (id: string, data: Record<string, unknown>) =>
    apiClient(`/restaurant/addon-options/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteAddonOption: (id: string) =>
    apiClient(`/restaurant/addon-options/${id}`, { method: 'DELETE' }),

  listOrders: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiClient(`/restaurant/orders${qs}`);
  },
  getOrder: (id: string) => apiClient(`/restaurant/orders/${id}`),
  updateOrder: (id: string, data: Record<string, unknown>) =>
    apiClient(`/restaurant/orders/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};
