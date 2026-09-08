const API_BASE_URL = 'http://localhost:5000';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const result = await response.json();

  if (!response.ok || result.success === false) {
    const error = new Error(result.message || result.error || 'Có lỗi xảy ra') as Error & { code?: string; status?: number };
    error.code = result.code;
    error.status = response.status;
    throw error;
  }

  return result.data as T;
}

export function get<T>(path: string): Promise<T> {
  return request<T>(path);
}

export function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body) });
}

export function patch<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
}

export function del<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'DELETE' });
}

export function upload<T>(path: string, formData: FormData): Promise<T> {
  return fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    body: formData
  }).then(async (response) => {
    const result = await response.json();
    if (!response.ok || result.success === false) {
      const error = new Error(result.message || result.error || 'Upload thất bại') as Error & { code?: string; status?: number };
      error.code = result.code;
      error.status = response.status;
      throw error;
    }
    return result.data as T;
  });
}
