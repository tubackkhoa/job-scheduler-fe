import { RJSFSchema } from '@rjsf/utils';

export {};

declare global {
  interface PluginData {
    id: number;
    package: string;
    description: string;
    interval: number;
  }

  interface User {
    id: number;
    username: string;
    roles: string[];
  }

  interface GlobalVariable {
    type: 'variable' | 'function' | string;
    doc: string;
  }

  interface Job {
    id: number;
    plugin_id: number;
    session_id: number;
    description: string;
    config?: unknown;
    active?: number; // usually 0 | 1
  }

  type Globals = Record<string, GlobalVariable>;

  interface PluginSchemaResponse {
    globals: Globals;
    jobs: Job[];
    schema: RJSFSchema;
    user: User;
  }

  interface LoginResponse {
    access_token: string;
    token_type: string;
  }

  interface Window {
    ctx: { user: User };
    // or: ctx?: YourType
  }
}
