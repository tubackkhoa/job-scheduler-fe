const { VITE_PROXY, VITE_API_BASE_URL } = import.meta.env;

export const API_BASE_URL =
  VITE_PROXY === 'true' ? '' : (VITE_API_BASE_URL ?? '');

const apiUrl = (path: string) => `${API_BASE_URL}${path}`;

type HttpMethod = 'GET' | 'POST';

const JSON_HEADERS = {
  'Content-Type': 'application/json'
};

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
        : `Expected JSON but got ${contentType}. Response: ${text.substring(0, 100)}`
    );
  }

  return res.json();
}

async function request<T = unknown>(
  path: string,
  options: RequestInit = {},
  responseType: 'json' | 'text' = 'json'
): Promise<T> {
  
  const res = await fetch(apiUrl(path), options);

  if (!res.ok) {
    await handleError(res);
  }

  return responseType === 'json' ? parseJson(res) : ((await res.text()) as T);
}

const postJson = <T = unknown>(
  path: string,
  body?: unknown,
  responseType: 'json' | 'text' = 'json'
) =>
  request<T>(
    path,
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: body ? JSON.stringify(body) : undefined
    },
    responseType
  );

export default {
  fetchSchema(sessionId: number, pluginId: number) {
    return request(`/api/schema/${sessionId}/${pluginId}`);
  },

  fetchTemplatePluginSchema(pluginPath: string) {
    return request(`/api/user/template/${pluginPath}`);
  },

  updateTemplatePlugin(pluginPath: string, payload: unknown) {
    return postJson(`/api/user/template/${pluginPath}`, payload);
  },

  runTemplatePlugin(pluginPath: string, payload: unknown): Promise<string> {
    return postJson(`/api/user/template/run/${pluginPath}`, payload, 'text');
  },

  fetchPlugins() {
    return request(`/api/plugins`);
  },

  updateConfig(jobId: number, payload: unknown) {
    return postJson(`/api/config/${jobId}`, payload);
  },

  activateJob(jobId: number, activation: boolean) {
    return postJson(`/api/activate/${jobId}/${activation}`);
  },

  deleteJob(jobId: number) {
    return postJson(`/api/delete/${jobId}`);
  },

  reloadPlugin(pkg: string) {
    return postJson(`/api/reload/${pkg}`);
  },

  createPlugin(packageName: string, interval: number, description = '') {
    return postJson(`/api/plugins`, {
      package: packageName,
      interval,
      description
    });
  },

  renderTemplate(
    packageName: string,
    template: string,
    params: object
  ): Promise<string> {
    return postJson(
      `/api/template/${packageName}`,
      { template, params },
      'text'
    );
  }
};
