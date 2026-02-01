import { getToken, clearToken, setToken } from '@/auth/tokenStorage';

const { VITE_PROXY, VITE_API_BASE_URL } = import.meta.env;

export const API_BASE_URL =
  VITE_PROXY === 'true' ? '' : (VITE_API_BASE_URL ?? '');

const apiUrl = (path: string) => `${API_BASE_URL}${path}`;

const JSON_HEADERS = {
  'Content-Type': 'application/json',
};

function buildQuery(
  params: Record<
    string,
    string | number | boolean | string[] | number[] | undefined
  >,
) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        // Add array values as multiple query params with the same key
        value.forEach((v) => searchParams.append(key, String(v)));
      } else {
        searchParams.append(
          key,
          typeof value === 'object' ? JSON.stringify(value) : String(value),
        );
      }
    }
  });

  return searchParams.toString();
}

async function handleError(res: Response): Promise<never> {
  const text = await res.text();
  throw new Error(text || `Request failed (${res.status})`);
}

async function parseJson(res: Response) {
  const contentType = res.headers.get('content-type');

  if (!contentType?.includes('application/json')) {
    const text = await res.text();
    throw new Error(
      contentType?.includes('text/html')
        ? `Response: ${text.substring(0, 200)}`
        : `Expected JSON but got ${contentType}. Response: ${text.substring(0, 100)}`,
    );
  }

  return res.json();
}

async function request<T = unknown>(
  path: string,
  options: RequestInit = {},
  responseType: 'json' | 'text' | 'raw' = 'json',
): Promise<T> {
  const token = getToken();

  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `${token.token_type} ${token.access_token}`);
  }

  const res = await fetch(apiUrl(path), {
    ...options,
    headers,
  });

  if (res.status === 401) {
    clearToken();
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    await handleError(res);
  }

  if (responseType === 'raw') {
    return res.body as T;
  }

  return responseType === 'json' ? parseJson(res) : ((await res.text()) as T);
}

const postJson = <T = unknown>(
  path: string,
  body?: unknown,
  responseType: 'json' | 'text' | 'raw' = 'json',
) =>
  request<T>(
    path,
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: body ? JSON.stringify(body) : undefined,
    },
    responseType,
  );

export type StreamOptions<T> = {
  followUp?: boolean;
  payload: T;
  onToken: (text: string) => void;
};

export default {
  health(): Promise<HealthResponse> {
    return request('/health');
  },
  async login(username: string, password: string): Promise<LoginResponse> {
    const data: LoginResponse = await request('/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username, password }),
    });

    setToken(data);
    return data;
  },

  fetchRoutes(pluginId: number): Promise<string[]> {
    return request(`/api/plugins/routes/${pluginId}`);
  },

  fetchAllRoutes(): Promise<{ [key: string]: string[] }> {
    return request(`/api/plugins/routes`);
  },

  fetchRouteSchema(pluginId: number, route: string): Promise<CodeSchema> {
    const query = buildQuery({
      route,
    });
    return request(`/api/plugins/routes/${pluginId}/schema?${query}`);
  },

  fetchSchema(
    sessionId: number,
    pluginId: number,
  ): Promise<PluginSchemaResponse> {
    return request(`/api/plugins/schema/${sessionId}/${pluginId}`);
  },

  fetchTemplatePluginSchema(pluginPath: string): Promise<PluginSchemaResponse> {
    return request(`/api/templates/user/${pluginPath}`);
  },

  fetchTemplatePluginCode(pluginPath: string): Promise<PluginUserCodeResponse> {
    return request(`/api/templates/user/code/${pluginPath}`);
  },

  updateTemplatePluginCode(pluginPath: string, payload: unknown) {
    return postJson(`/api/templates/user/code/${pluginPath}`, payload);
  },

  updateTemplatePlugin(pluginPath: string, payload: unknown) {
    return postJson(`/api/templates/user/${pluginPath}`, payload);
  },

  runTemplatePlugin(pluginPath: string, payload: unknown): Promise<string> {
    return postJson(`/api/templates/user/run/${pluginPath}`, payload, 'text');
  },

  fetchPlugins(): Promise<PluginData[]> {
    return request(`/api/plugins`);
  },

  updateConfig(jobId: number, payload: unknown) {
    return postJson(`/api/jobs/${jobId}/config`, payload);
  },

  getUsers(): Promise<User[]> {
    return request(`/api/users`);
  },

  getPolicy(): Promise<[string, string][]> {
    return request(`/api/users/policy`);
  },

  updateRoles(userId: number, roles: string[]): Promise<User> {
    return postJson(`/api/users/${userId}`, {
      roles,
    });
  },

  activateJob(
    jobId: number,
    activation: boolean,
  ): Promise<{ success: boolean }> {
    return postJson(
      `/api/jobs/${jobId}/${activation ? 'activate' : 'deactivate'}`,
    );
  },

  deleteJob(jobId: number) {
    return request(`/api/jobs/${jobId}`, {
      method: 'DELETE',
      headers: JSON_HEADERS,
    });
  },

  reloadPlugin(pkg: string) {
    return postJson(`/api/plugins/reload/${pkg}`);
  },

  createPlugin(
    packageName: string,
    interval: number,
    description = '',
  ): Promise<PluginData> {
    return postJson(`/api/plugins`, {
      package: packageName,
      interval,
      description,
    });
  },

  renderTemplate(
    packageName: string,
    template: string,
    params: object,
  ): Promise<string> {
    return postJson(
      `/api/templates/${packageName}`,
      { template, params },
      'text',
    );
  },

  fetchLogs({
    jobId,
    searchText,
    limit,
    sort = 'desc',
  }: SearchLogsParams): Promise<SearchLogsResponse> {
    const query = buildQuery({
      search: searchText,
      limit,
      sort,
    });

    return request(`/api/logs/${jobId}?${query}`);
  },
  clearLogs(jobId: number): Promise<void> {
    return request(`/api/logs/${jobId}/clear`, {
      method: 'POST',
    });
  },

  getSignals({
    jobId,
    limit = 100,
  }: GetSignalsParams): Promise<GetSignalsResponse> {
    return request(`/api/signals/${jobId}?limit=${limit}`);
  },

  getJobStats(params: JobStatsParams = {}): Promise<JobStatsResponse> {
    const query = buildQuery(
      params as unknown as Record<
        string,
        string | number | boolean | string[] | number[] | undefined
      >,
    );
    return request(`/api/stats/jobs${query ? `?${query}` : ''}`);
  },

  getValueVersions(params: ValueVersionParams): Promise<ValueVersionsResponse> {
    const query = buildQuery({
      limit: params.limit ?? 100,
      offset: params.offset ?? 0,
      ...params,
    });
    return request(`/api/plugins/value_versions?${query}`);
  },
  async streamChat<T>({
    followUp = false,
    payload,
    onToken,
  }: StreamOptions<T>): Promise<string> {
    const body: ReadableStream = await postJson(
      `/api/chatbot/${followUp ? 'edit' : 'generate'}`,
      payload,
      'raw',
    );

    if (!body) {
      throw new Error('No response body');
    }

    const reader = body.getReader();
    const decoder = new TextDecoder();

    let text = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      text += chunk;
      onToken(text);
    }

    return text;
  },
};
