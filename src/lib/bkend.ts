// bkend.ai client setup
// API Docs: https://bkend.gitbook.io/bkend-docs

const BKEND_API_KEY = process.env.NEXT_PUBLIC_BKEND_API_KEY;

const BASE_URL = 'https://api-client.bkend.ai';

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
    const details = error.error?.details?.fieldErrors;
    if (details) {
      const messages = Object.entries(details)
        .map(([field, errs]) => `${field}: ${(errs as string[]).join(', ')}`)
        .join('; ');
      throw new Error(messages);
    }
    throw new Error(error.error?.message || error.message || 'Request failed');
  }

  const json = await res.json();
  return json.data !== undefined ? json.data : json;
}

export const bkend = {
  auth: {
    login: (data: { email: string; password: string }) =>
      request('/v1/auth/email/signin', {
        method: 'POST',
        body: JSON.stringify({ ...data, method: 'password' }),
      }),
    register: (data: { email: string; password: string; name: string }) =>
      request('/v1/auth/email/signup', {
        method: 'POST',
        body: JSON.stringify({ ...data, method: 'password' }),
      }),
    me: () => request('/v1/auth/me'),
    logout: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-token');
        localStorage.removeItem('refresh-token');
      }
    },
  },
  collection: (name: string) => ({
    find: async (query?: Record<string, unknown>) => {
      const params = new URLSearchParams();
      if (query) {
        Object.entries(query).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.set(key, String(value));
          }
        });
      }
      const qs = params.toString();
      const result = await request<unknown>(`/v1/data/${name}${qs ? `?${qs}` : ''}`);
      // bkend.ai returns { items: [...], pagination: {...} }
      if (result && typeof result === 'object' && 'items' in result) {
        return (result as { items: unknown[] }).items;
      }
      return result;
    },
    findById: (id: string) =>
      request(`/v1/data/${name}/${id}`),
    create: (data: Record<string, unknown>) =>
      request(`/v1/data/${name}`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) =>
      request(`/v1/data/${name}/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request(`/v1/data/${name}/${id}`, { method: 'DELETE' }),
  }),
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'my_default');

    const res = await fetch(
      'https://api.cloudinary.com/v1_1/dsohxszgq/auto/upload',
      { method: 'POST', body: formData }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || '파일 업로드에 실패했습니다');
    }
    const data = await res.json();
    return { url: data.secure_url };
  },
};
