export const getApiBase = (): string => {
  // 1. Allow local runtime override for diagnostic testing
  if (typeof window !== 'undefined') {
    const override = localStorage.getItem('scalora_api_override');
    if (override && override.trim().length > 0) {
      return override.trim().replace(/\/$/, '');
    }
  }

  // 2. Check environment variables (Vite & Next.js conventions)
  const envUrl =
    import.meta.env.VITE_API_URL ||
    import.meta.env.NEXT_PUBLIC_API_URL;

  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/$/, '');
  }

  // 3. Default to same-origin /api for seamless proxy / serverless routing
  return '/api';
};

export const getDefaultCourseImage = (category?: string): string => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('business') || cat.includes('operation')) {
    return 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1080&auto=format&fit=crop&q=80';
  }
  if (cat.includes('communication') || cat.includes('soft') || cat.includes('lead')) {
    return 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1080&auto=format&fit=crop&q=80';
  }
  if (cat.includes('ai') || cat.includes('tech') || cat.includes('cloud') || cat.includes('auto')) {
    return 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1080&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1080&auto=format&fit=crop&q=80';
};

export const getDefaultAvatar = (name?: string): string => {
  const cleanName = name ? encodeURIComponent(name.trim()) : 'User';
  return `https://ui-avatars.com/api/?name=${cleanName}&background=0284C7&color=fff&bold=true`;
};

export const resolveMediaUrl = (url: string | null | undefined): string => {
  if (!url || typeof url !== 'string' || !url.trim()) return '';
  let trimmed = url.trim();

  // Rewrite obsolete / decommissioned ephemeral hostnames
  if (trimmed.includes('scalora-lms-3.onrender.com')) {
    trimmed = trimmed.replace('https://scalora-lms-3.onrender.com', '').replace('http://scalora-lms-3.onrender.com', '');
    if (!trimmed.startsWith('/')) trimmed = `/${trimmed}`;
  }

  // Handle data URIs and blob URIs directly
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // Handle absolute external CDN URLs (e.g. Unsplash, UI Avatars, Supabase Storage)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Handle client-side public assets like /courses/... or /logo.png
  if (
    trimmed.startsWith('/courses/') ||
    trimmed.startsWith('/icons/') ||
    trimmed.startsWith('/clients/') ||
    trimmed.startsWith('/logo') ||
    trimmed.startsWith('/scalora-')
  ) {
    return trimmed;
  }

  // Handle uploaded assets via backend API
  const apiBase = getApiBase();
  if (apiBase.startsWith('http://') || apiBase.startsWith('https://')) {
    const origin = apiBase.replace(/\/api\/?$/, '');
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    // If path is /uploads/..., ensure it maps through /api/uploads/...
    const finalPath = cleanPath.startsWith('/uploads/') ? `/api${cleanPath}` : cleanPath;
    return `${origin}${finalPath}`;
  }

  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    const finalPath = cleanPath.startsWith('/uploads/') ? `/api${cleanPath}` : cleanPath;
    return `http://localhost:5000${finalPath}`;
  }

  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return cleanPath.startsWith('/uploads/') ? `/api${cleanPath}` : cleanPath;
};

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('scalora_token');
  const apiBase = getApiBase();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const targetUrl = `${apiBase}${cleanEndpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(targetUrl, {
      ...options,
      headers,
    });
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      `Failed to connect to LMS backend API at ${targetUrl}. Please verify backend service status. (${err.message})`,
      0
    );
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const textPreview = await response.text().catch(() => '');
    if (response.status === 413 || textPreview.toLowerCase().includes('too large') || textPreview.toLowerCase().includes('entity')) {
      throw new ApiError('File exceeds the 10 MB upload limit.', 413);
    }
    if (response.status === 503 || textPreview.includes('Service Suspended')) {
      throw new ApiError(
        'Backend service is temporarily suspended or unavailable. Please verify Render / backend host status.',
        503
      );
    }
    throw new ApiError(
      `Received non-JSON response from server (${response.status}): ${textPreview.slice(0, 80) || 'Empty body'}`,
      response.status || 404
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 413 || String(data.message).toLowerCase().includes('too large')) {
      throw new ApiError('File exceeds the 10 MB upload limit.', 413, data);
    }
    throw new ApiError(data.message || 'An unexpected error occurred', response.status, data);
  }

  return data;
}

export const api = {
  get: <T>(endpoint: string, headers?: HeadersInit) =>
    request<T>(endpoint, { method: 'GET', headers }),

  post: <T>(endpoint: string, body?: any, headers?: HeadersInit) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    }),

  put: <T>(endpoint: string, body?: any, headers?: HeadersInit) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    }),

  patch: <T>(endpoint: string, body?: any, headers?: HeadersInit) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    }),

  delete: <T>(endpoint: string, headers?: HeadersInit) =>
    request<T>(endpoint, { method: 'DELETE', headers }),
};
