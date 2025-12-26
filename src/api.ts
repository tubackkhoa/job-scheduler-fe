export const API_BASE_URL =
  // @ts-ignore
  import.meta.env.VITE_API_BASE_URL ?? '';

export default {
  async fetchSchema(sessionId: number, pluginId: number) {
    const res = await fetch(`${API_BASE_URL}/schema/${sessionId}/${pluginId}`);

    if (!res.ok) {
      throw new Error((await res.text()) || `Schema not found`);
    }

    return res.json();
  },

  async fetchPlugins() {
    const res = await fetch(`${API_BASE_URL}/plugins`);

    if (!res.ok) {
      throw new Error('Failed to load plugins');
    }

    return res.json();
  },
  async updateConfig(jobId: number, payload: Object) {
    const res = await fetch(`${API_BASE_URL}/config/${jobId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error((await res.text()) || 'Plugin execution failed');
    }

    return res.json();
  },
  async activateJob(jobId: number, activation: boolean) {
    const res = await fetch(`${API_BASE_URL}/activate/${jobId}/${activation}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || 'Plugin activation failed');
    }

    return res.json();
  },
  async deleteJob(jobId: number) {
    const res = await fetch(`${API_BASE_URL}/delete/${jobId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || 'Plugin deletion failed');
    }

    return res.json();
  },
  async reloadPlugin(pkg: string) {
    const res = await fetch(`${API_BASE_URL}/reload/${pkg}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || 'Plugin reload failed');
    }

    return res.json();
  },
  async createPlugin(
    packageName: string,
    interval: number,
    description?: string
  ) {
    const res = await fetch(`${API_BASE_URL}/plugins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        package: packageName,
        interval,
        description: description || '',
      }),
    });

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || 'Failed to create plugin');
    }

    return res.json();
  },
};
