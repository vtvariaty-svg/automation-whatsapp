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
    // Mock login for now
    return { token: 'token_demo_123', user: { email: credentials.email, name: 'User Demo' } };
  },
  getUser: async () => {
    // Mock get user
    return { email: 'demo@example.com', name: 'User Demo' };
  }
};
