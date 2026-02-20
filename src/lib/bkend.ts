// bkend.ai client setup
// TODO: Replace with actual @bkend/client when configured
// For now, this is a placeholder that will be connected to bkend.ai

const BKEND_API_KEY = process.env.NEXT_PUBLIC_BKEND_API_KEY;
const BKEND_PROJECT_ID = process.env.NEXT_PUBLIC_BKEND_PROJECT_ID;

const BASE_URL = `https://api.bkend.ai/v1/projects/${BKEND_PROJECT_ID}`;

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('auth-token')
      : null;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': BKEND_API_KEY || '',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || 'Request failed');
  }

  return res.json();
}

export const bkend = {
  auth: {
    login: (data: { email: string; password: string }) =>
      request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    register: (data: { email: string; password: string; name: string }) =>
      request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    logout: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-token');
      }
    },
  },
  collection: (name: string) => ({
    find: (query?: Record<string, unknown>) =>
      request(`/collections/${name}?${new URLSearchParams(query as Record<string, string>).toString()}`),
    findById: (id: string) =>
      request(`/collections/${name}/${id}`),
    create: (data: Record<string, unknown>) =>
      request(`/collections/${name}`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) =>
      request(`/collections/${name}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request(`/collections/${name}/${id}`, { method: 'DELETE' }),
  }),
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('auth-token')
        : null;
    const res = await fetch(`${BASE_URL}/files/upload`, {
      method: 'POST',
      headers: {
        'X-API-Key': BKEND_API_KEY || '',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },
};
