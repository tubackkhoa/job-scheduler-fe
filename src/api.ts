import storage from './storage';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export const apiUrl = (path: string) => `${API_BASE_URL}${path}`;
export const wsUrl = (path: string) => apiUrl(path).replace(/^http/, 'ws');

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

async function readTextStream(
  body: ReadableStream,
  onToken: (text: string) => void,
): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();

  let text = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    onToken(chunk);
    text += chunk;
  }

  return text;
}

async function request<T = unknown>(
  path: string,
  options: RequestInit = {},
  responseType: 'json' | 'text' | 'raw' = 'json',
  onHeader?: (headers: Headers) => void,
): Promise<T> {
  const token = storage.getToken();

  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `${token.token_type} ${token.access_token}`);
  }

  const res = await fetch(apiUrl(path), {
    ...options,
    headers,
  });

  if (res.status === 401) {
    // let user manually logout in case of token expiration or invalid token, instead of auto logout which might cause bad UX
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    await handleError(res);
  }

  if (onHeader) onHeader(res.headers);

  switch (responseType) {
    case 'json':
      return parseJson(res);
    case 'text':
      return res.text() as Promise<T>;
    case 'raw':
      return res.body as T;
  }
}

const postJson = <T = unknown>(
  path: string,
  body?: unknown,
  responseType: 'json' | 'text' | 'raw' = 'json',
  onHeader?: (headers: Headers) => void,
) =>
  request<T>(
    path,
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: body ? JSON.stringify(body) : undefined,
    },
    responseType,
    onHeader,
  );

export type StreamOptions<T> = {
  followUp?: boolean;
  payload: T;
  onToken: (text: string) => void;
  onMeta?: (meta: { model: string }) => void;
};

export type WSStreamOptions<T> = {
  payload?: any; // optional data to send after connection
  onMessage?: (data: T) => void; // called for each message
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (err: Event) => void;
  reconnect?: boolean; // default true
  reconnectDelay?: number; // default 2000 ms
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

    return data;
  },

  fetchRoutes(pluginId: number): Promise<RoutesResponse> {
    return request(`/api/plugins/routes/${pluginId}`);
  },

  fetchAllRoutes(): Promise<AllRoutesResponse> {
    return request(`/api/plugins/routes`);
  },

  downloadModule(name: string, version: string): Promise<PostResponse> {
    return postJson(`/api/plugins/download/${name}`, {
      version,
    });
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

  updateTemplatePluginCode(
    pluginPath: string,
    payload: unknown,
  ): Promise<PostResponse> {
    return postJson(`/api/templates/user/code/${pluginPath}`, payload);
  },

  updateTemplatePlugin(
    pluginPath: string,
    payload: unknown,
  ): Promise<PostResponse> {
    return postJson(`/api/templates/user/${pluginPath}`, payload);
  },

  runTemplatePlugin(pluginPath: string, payload: unknown): Promise<string> {
    return postJson(`/api/templates/user/run/${pluginPath}`, payload, 'text');
  },

  fetchPlugins(): Promise<PluginData[]> {
    return request(`/api/plugins`);
  },

  saveJob(
    jobId: number,
    payload: MakeOptional<Job, 'id' | 'plugin_id' | 'session_id'>,
  ): Promise<PostResponse> {
    return postJson(`/api/jobs/${jobId}`, payload);
  },

  getUsers(): Promise<User[]> {
    return request(`/api/users`);
  },

  me(): Promise<User> {
    return request(`/api/users/me`);
  },

  getPolicy(): Promise<[string, string][]> {
    return request(`/api/users/policy`);
  },

  updateRoles(userId: number, roles: string[]): Promise<User> {
    return postJson(`/api/users/${userId}`, {
      roles,
    });
  },

  getJobConfig(jobId: number): Promise<Record<string, number[]>> {
    return request(`/api/jobs/${jobId}/config`);
  },

  activateJob(jobId: number, activation: boolean): Promise<PostResponse> {
    return postJson(
      `/api/jobs/${jobId}/${activation ? 'activate' : 'deactivate'}`,
    );
  },

  deleteJob(jobId: number): Promise<PostResponse> {
    return request(`/api/jobs/${jobId}`, {
      method: 'DELETE',
      headers: JSON_HEADERS,
    });
  },

  reloadPlugin(pkg: string): Promise<PostResponse> {
    return postJson(`/api/plugins/reload/${pkg}`);
  },

  createPlugin(packageName: string, description = ''): Promise<PluginData> {
    return postJson(`/api/plugins`, {
      package: packageName,
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
    payload,
    onToken,
    onMeta,
  }: StreamOptions<T>): Promise<string> {
    const body: ReadableStream = await postJson(
      '/api/chatbot/chat',
      payload,
      'raw',
      (headers) => {
        const modelName = headers.get('X-Model-Name');
        if (onMeta && modelName) {
          onMeta({ model: modelName });
        }
      },
    );

    if (!body) {
      throw new Error('No response body');
    }

    return readTextStream(body, onToken);
  },
  async streamWebSocket<T>(
    url: string,
    {
      payload,
      onMessage,
      onOpen,
      onClose,
      onError,
      reconnect = true,
      reconnectDelay = 2000,
    }: WSStreamOptions<T>,
  ): Promise<WebSocket> {
    return new Promise((resolve) => {
      let isActive = true;
      let ws: WebSocket;
      let reconnectTimeout: number | null = null;

      const connect = () => {
        if (!isActive) return;

        ws = new WebSocket(url.startsWith('http') ? url : wsUrl(url));

        ws.onopen = () => {
          if (payload) {
            ws.send(JSON.stringify(payload));
          }
          if (onOpen) onOpen();
          resolve(ws); // resolve the promise once connection is open
        };

        ws.onmessage = (e) => {
          try {
            const data: T = JSON.parse(e.data);
            if (onMessage) onMessage(data);
          } catch (err) {
            console.error('Failed to parse WS message', err);
          }
        };

        ws.onclose = () => {
          if (onClose) onClose();
          if (isActive && reconnect) {
            reconnectTimeout = setTimeout(connect, reconnectDelay);
          }
        };

        ws.onerror = (err) => {
          if (onError) onError(err);
          ws.close(); // triggers onclose
        };
      };

      connect();

      // cleanup function
      const cleanup = () => {
        isActive = false;
        if (reconnectTimeout) clearTimeout(reconnectTimeout);
        if (ws && ws.readyState === WebSocket.OPEN) ws.close();
      };

      // attach cleanup to window unload to prevent dangling WS
      window.addEventListener('beforeunload', cleanup);
    });
  },
};
