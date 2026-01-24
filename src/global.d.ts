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

  interface LogEntry {
    id?: number;
    offset: number;
    timestamp: string;
    level: string;
    message: string;
  }

  interface ResultGroup {
    matched_entry: LogEntry;
    following_entries: LogEntry[];
    offset: number;
    timestamp: string;
  }

  interface SearchLogsParams {
    jobId: number;
    searchText?: string;
    limit?: number;
    offset?: number;
    sort?: 'asc' | 'desc';
  }

  interface LogsResponse {
    // adjust to your backend shape
    result_groups: ResultGroup[];
  }

  interface HealthResponse {
    status: string;
    database: string;
    plugin_manager: string;
    plugins: number;
    active_jobs: number;
  }

  interface SearchLogsResponse {
    logs: LogEntry[];
    total: number;
    filtered: number;
    returned: number;
    min_offset: number | null;
    max_offset: number | null;
    has_more: boolean;
  }

  interface SignalMessage {
    // adjust fields if you know the exact shape
    [key: string]: unknown;
  }

  interface GetSignalsParams {
    jobId: number;
    limit?: number; // default 100 (backend)
  }

  interface GetSignalsResponse {
    signals: SignalMessage[];
    count: number;
    job_id: number;
  }

  interface Window {
    ctx: { user: User };
    // or: ctx?: YourType
  }
}
