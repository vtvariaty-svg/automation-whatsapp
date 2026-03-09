const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

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
  }
};
