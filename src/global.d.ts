import { FieldProps, RJSFSchema } from '@rjsf/utils';
import dayjs from 'dayjs';
import * as UtilsNS from './utils';
import _ from 'lodash';
import AppIconNS from './components/AppIcon';
import ComponentsNS from './components';
import ApiNS from './api';
import ReactNS from 'react';
import * as ConstantsNS from './constants';
import { loadPyodide as loadPyodideNS } from 'pyodide';

declare global {
  const AppIcon: typeof AppIconNS;
  const Components: typeof ComponentsNS;
  const Constants: typeof ConstantsNS;
  const api: typeof ApiNS;
  const Utils: typeof UtilsNS & {
    _: typeof _;
    dayjs: typeof dayjs;
  };

  const loadPyodide: typeof loadPyodideNS;

  type Order = 'asc' | 'desc';

  interface RouteStateItem {
    loading: boolean;
    routes?: string[];
    portal?: CodeSchema;
  }

  type RouteState = Record<number, RouteStateItem>;

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
    default: ReactNS.FC<FieldProps>;
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
    config?: { [key: string]: any };
    active?: number; // usually 0 | 1
  }

  type Globals = Record<string, GlobalVariable>;

  interface PluginSchemaResponse {
    jobs: Job[];
    schema: RJSFSchema;
    user: User;
    globals?: Globals;
  }

  interface PostResponse {
    success: boolean;
  }

  interface RoutesResponse {
    package: string;
    routes: [string[], CodeSchema];
  }

  interface PluginPageData extends RoutesResponse {
    pluginId: number;
  }

  type AllRoutesResponse = Record<string, [string[], CodeSchema]>;

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

  interface ValueVersion {
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

  interface JobStatsParams {
    limit?: number;
    offset?: number;
    include_signals?: boolean;
    search_text?: string;
    active?: boolean;
    plugin_id?: number[];
    model_key?: string[];
    config?: Record<string, number[]>;
    version_id?: string[];
    order_by?: string;
    sort?: 'asc' | 'desc';
    session_id?: number[];
  }

  interface JobStatsResponse {
    jobs: Job[];
    signals_map: Record<number, Signal[]>;
    versions: Record<string, ValueVersion[]>;
    total: number;
    limit: number;
    offset: number;
  }

  interface ValueVersionParams {
    field_id: string;
    plugin_id?: number;
    search?: string;
    limit?: number;
    offset?: number;
  }

  interface ValueVersionsResponse {
    versions: ValueVersion[];
    count: number;
    total: number;
    search: string | null;
    limit: number;
    offset: number;
  }

  interface EnvDoc {
    filters: Record<string, unknown>;
    globals: Record<string, unknown>;
    tests: string[];
    tags: string[];
  }

  interface ConfigFormContext<T> {
    formData: T;
    pluginPackage: string;
    env: EnvDoc;
    sessionId: number;
  }

  type ConfigFieldProps<T = any, S = any> = FieldProps<
    T,
    S,
    ConfigFormContext<T>
  >;

  interface Window {
    ctx: { user: User };
    // or: ctx?: YourType
  }
}

// extend declaration
declare module '@mui/material/styles' {
  interface ChartPalette {
    background: string;
    textColor: string;
    grid: string;
    crosshair: string;
    border: string;
  }

  // This extends the theme config type: createTheme({ palette: { chart: ... } })

  interface Palette {
    chart: ChartPalette;
  }

  interface PaletteOptions {
    chart?: ChartPalette;
  }
}
