// Helper for making authenticated admin API calls

function getAuthHeader(): string | null {
  if (typeof window === 'undefined') return null;
  
  const credentials = localStorage.getItem('admin_credentials');
  if (!credentials) return null;

  try {
    const { username, password } = JSON.parse(credentials);
    return 'Basic ' + btoa(`${username}:${password}`);
  } catch {
    return null;
  }
}

interface AdminFetchOptions extends RequestInit {
  params?: Record<string, string>;
}

export async function adminFetch<T>(
  endpoint: string,
  options: AdminFetchOptions = {}
): Promise<T> {
  const authHeader = getAuthHeader();
  
  if (!authHeader) {
    throw new Error('Not authenticated');
  }

  const { params, ...fetchOptions } = options;

  // Build URL with query params
  let url = endpoint;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value);
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Clear invalid credentials
      localStorage.removeItem('admin_credentials');
      throw new Error('Session expired. Please log in again.');
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

// Convenience methods
export const adminApi = {
  get: <T>(endpoint: string, params?: Record<string, string>) =>
    adminFetch<T>(endpoint, { method: 'GET', params }),

  post: <T>(endpoint: string, body: unknown) =>
    adminFetch<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  delete: <T>(endpoint: string, params?: Record<string, string>) =>
    adminFetch<T>(endpoint, { method: 'DELETE', params }),
};

