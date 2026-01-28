import { FieldProps, RJSFSchema } from '@rjsf/utils';
import React from 'react';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import * as Mui from '@mui/material';
import * as Utils from '@/utils';
import _ from 'lodash';
import * as MuiIcon from '@mui/icons-material';

export interface GlobalProps {
  React: typeof React;
  MuiIcon: typeof MuiIcon;
  Mui: typeof Mui & {
    ConfirmationDialog: typeof ConfirmationDialog;
  };
  Utils: typeof Utils & {
    _: typeof _;
  };
}

export type DynamicFieldProps = FieldProps & GlobalProps;
export type MarkdownFieldProps = GlobalProps & {
  source: string;
};
export type ModuleProps = DynamicFieldProps | MarkdownFieldProps;

declare global {
  type Order = 'asc' | 'desc';
  interface PluginData {
    id: number;
    package: string;
    description: string;
    interval: number;
  }

  interface CodeSchema {
    code?: string;
    url?: string;
  }

  interface ModuleCode {
    default: React.FC<ModuleProps>;
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
    jobs: Job[];
    schema: RJSFSchema;
    user: User;
    globals?: Globals;
  }

  interface PluginUserCodeResponse {
    form: string;
    script: string;
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
    signals: Signal[];
    count: number;
    job_id: number;
  }

  interface SqlVersion {
    id: number;
    name: string;
    description?: string;
    value?: string;
    is_active?: boolean;
  }

  interface Signal {
    id: number;
    job_id: number;
    model_key: string;
    message: string;
    created_at: string;
    captured_at: string;
  }

  interface JobStatsItem extends Job {
    sql_version?: SqlVersion;
    last_signal?: string; // ISO timestamp
    signals?: Signal[];
  }

  interface JobStatsParams {
    limit?: number;
    offset?: number;
    include_signals?: boolean;
    search_text?: string;
    active?: boolean;
    plugin_id?: number[];
    model_key?: string[];
    sql_id?: number[];
    order_by?: string;
    sort?: 'asc' | 'desc';
    session_id?: number[];
  }

  interface JobStatsResponse {
    items: JobStatsItem[];
    total: number;
    limit: number;
    offset: number;
  }

  interface SqlVersionsResponse {
    versions: SqlVersion[];
    count: number;
    total: number;
    search: string | null;
    limit: number;
    offset: number;
  }

  interface Window {
    ctx: { user: User };
    globalProps: GlobalProps;
    // or: ctx?: YourType
  }
}
