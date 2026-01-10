export const API_BASE_URL =
  // @ts-ignore
  import.meta.env.VITE_API_BASE_URL ?? '';

const parseJsonResponse = async (res: Response, url: string) => {
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await res.text();
    // If we get HTML, it's likely a 404 or error page
    if (contentType?.includes('text/html')) {
      throw new Error(`Response: ${text.substring(0, 200)}`);
    }
    throw new Error(
      `Expected JSON but got ${contentType}. Response: ${text.substring(
        0,
        100
      )}`
    );
  }
  return res.json();
};

export default {
  async fetchSchema(sessionId: number, pluginId: number) {
    const url = `${API_BASE_URL}/schema/${sessionId}/${pluginId}`;

    const res = await fetch(url);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Schema not found (${res.status})`);
    }

    return parseJsonResponse(res, url);
  },

  async fetchPlugins() {
    const url = `${API_BASE_URL}/plugins`;

    const res = await fetch(url);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Failed to load plugins (${res.status})`);
    }

    return parseJsonResponse(res, url);
  },
  async updateConfig(jobId: number, payload: Object) {
    const url = `${API_BASE_URL}/config/${jobId}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Plugin execution failed (${res.status})`);
    }

    return parseJsonResponse(res, url);
  },
  async activateJob(jobId: number, activation: boolean) {
    const url = `${API_BASE_URL}/activate/${jobId}/${activation}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || `Plugin activation failed (${res.status})`);
    }

    return parseJsonResponse(res, url);
  },
  async deleteJob(jobId: number) {
    const url = `${API_BASE_URL}/delete/${jobId}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || `Plugin deletion failed (${res.status})`);
    }

    return parseJsonResponse(res, url);
  },
  async reloadPlugin(pkg: string) {
    const url = `${API_BASE_URL}/reload/${pkg}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || `Plugin reload failed (${res.status})`);
    }

    return parseJsonResponse(res, url);
  },
  async createPlugin(
    packageName: string,
    interval: number,
    description?: string
  ) {
    const url = `${API_BASE_URL}/plugins`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        package: packageName,
        interval,
        description: description || ''
      })
    });

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || `Failed to create plugin (${res.status})`);
    }

    return parseJsonResponse(res, url);
  },
  async renderTemplate(packageName: string, template: string, params: object) {
    const url = `${API_BASE_URL}/template/${packageName}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        template,
        params
      })
    });

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || `Failed to render template (${res.status})`);
    }

    return parseJsonResponse(res, url);
  }
};
