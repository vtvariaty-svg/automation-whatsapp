const API_URL = '/api';
console.log('API_CLIENT: using relative path /api');

export async function apiClient(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('auth_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

export const authApi = {
  login: async (credentials: any) => {
    return apiClient('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  },
  register: async (data: any) => {
    return apiClient('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  getUser: async () => {
    return { email: 'demo@example.com', name: 'User Demo' };
  },
  getTenantConfig: async () => {
    return apiClient('/tenant/config');
  },
  updateTenantConfig: async (data: any) => {
    return apiClient('/tenant/config', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  createProduct: async (data: any) => {
    return apiClient('/products', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  listProducts: async () => {
    return apiClient('/products');
  },
  updateProduct: async (id: string, data: any) => {
    return apiClient(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  deleteProduct: async (id: string) => {
    return apiClient(`/products/${id}`, {
      method: 'DELETE'
    });
  },
  testAI: async (message: string) => {
    return apiClient('/ai/test', {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  }
};

export const billingApi = {
  getSubscription: async () => {
    return apiClient('/billing/subscription');
  },
  createCheckout: async (plan: string) => {
    return apiClient('/billing/checkout', {
      method: 'POST',
      body: JSON.stringify({ plan })
    });
  },
};
