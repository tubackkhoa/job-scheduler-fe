import json5 from 'json5';
import { PyodideAPI } from 'pyodide';
import { linter, Diagnostic } from '@codemirror/lint';
import { syntaxTree } from '@codemirror/language';
import _ from 'lodash';
import api from './api';
import { LanguageSupport, LRLanguage } from '@codemirror/language';
import { parseMixed } from '@lezer/common';
import { javascript } from '@codemirror/lang-javascript';
import { yamlLanguage } from '@codemirror/lang-yaml';
import jinja from './jinja.py?raw';
import { JinjaCompletionConfig } from '@codemirror/lang-jinja';
import * as esbuild from 'esbuild-wasm';
import wasmUrl from 'esbuild-wasm/esbuild.wasm?url';
import dayjs from 'dayjs';
import { Chart } from 'chart.js/auto';
import {
  CandlestickController,
  CandlestickElement
} from 'chartjs-chart-financial';
import 'chartjs-adapter-luxon';
import utc from 'dayjs/plugin/utc';
import MarkdownIt from 'markdown-it';

Chart.register(CandlestickController, CandlestickElement);

dayjs.extend(utc);

/* ---------- Markdown instance (singleton) ---------- */

export const markdown = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: true
});

export const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
};

export const getCodeHash = (str: string) => {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    // hash * 33 + charCode
    hash = (hash << 5) + hash + str.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
};

// Helper to resolve $ref schema if present
const resolveRef = (schema: any, ref: string) => {
  if (!schema.$defs || !ref) return null;
  const defKey = ref.replace('#/$defs/', '');
  return schema.$defs[defKey] ?? null;
};

export const convertByType = (value: string, field: any) => {
  switch (typeof field) {
    case 'number':
      return Number(value);

    case 'boolean':
      return value === 'true';

    case 'bigint':
      return BigInt(value);

    case 'object':
      return json5.parse(value);

    default:
      return value;
  }
};

export const buildUiSchemaWithExpr = async (
  packageName: string,
  context: Record<string, any>,
  schema: any,
  changedFieldId: string
): Promise<[any, string[]]> => {
  if (!schema) return schema;

  const newSchema = _.cloneDeep(schema);
  const stack = [{ node: newSchema }];
  const errors = [];

  while (stack.length) {
    const { node } = stack.pop()!;

    for (const [sKey, sValue] of Object.entries(node)) {
      if (sKey.startsWith('ui:expr')) {
        const [expr, deps] =
          typeof sValue === 'string'
            ? [sValue]
            : (sValue as [string, string[]]);

        // only render if deps changed, or first time when no changedFieldId
        if (!deps || !changedFieldId || deps.includes(changedFieldId)) {
          const subKey = sKey === 'ui:expr' ? '' : sKey.replace('ui:expr:', '');
          try {
            const extraOptions = await jinjaEvaluate(
              packageName,
              expr,
              context,
              !!subKey
            );

            if (subKey) {
              node[subKey] = convertByType(extraOptions, node[subKey]);
            } else {
              _.merge(node, extraOptions);
            }
          } catch (ex) {
            errors.push(ex.message);
          }
        }
      }
    }

    if (node.type === 'object' && node.properties) {
      for (const child of Object.values(node.properties)) {
        stack.push({ node: child });
      }
    }

    if (node.$ref) {
      const refSchema = resolveRef(newSchema, node.$ref);
      if (refSchema) stack.push({ node: refSchema });
    }
  }

  // return both to catch error
  return [newSchema, errors];
};

export const extractUiSchema = (schema: any): Record<string, any> => {
  if (!schema?.properties) return {};

  const uiSchema: Record<string, any> = {
    'ui:submitButtonOptions': { norender: true }
  };

  const stack: Array<{
    props: Record<string, any>;
    target: Record<string, any>;
  }> = [{ props: schema.properties, target: uiSchema }];

  while (stack.length) {
    const { props, target } = stack.pop()!;

    for (const [key, prop] of Object.entries(props)) {
      const uiEntry: Record<string, any> = {};

      for (const [uiKey, uiValue] of Object.entries(prop)) {
        if (uiKey.startsWith('ui:') && !uiKey.startsWith('ui:expr')) {
          uiEntry[uiKey] = uiValue;
        }
      }

      let nestedProps: Record<string, any> | null = null;

      if (prop.type === 'object' && prop.properties) {
        nestedProps = prop.properties;
      } else if (prop.$ref) {
        const defSchema = resolveRef(schema, prop.$ref);
        if (defSchema?.type === 'object' && defSchema.properties) {
          nestedProps = defSchema.properties;
        }
      }

      if (nestedProps) {
        target[key] = uiEntry;
        stack.push({ props: nestedProps, target: target[key] });
      } else if (Object.keys(uiEntry).length > 0) {
        target[key] = uiEntry;
      }
    }
  }

  return uiSchema;
};

/* ================================
 * Theme
 * ================================ */

export const getSystemTheme = (): 'dark' | 'light' =>
  window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';

/* ================================
 * Message Formatting
 * ================================ */

export const formatMessage = (message: any): any => {
  if (typeof message !== 'string') return message;

  return message.replace(
    /\[?datetime\.datetime\(([^)]+)\)/g,
    (match, dtStr) => {
      try {
        const parts = dtStr.split(', ').map(Number);
        const [year, month, day, hour, minute, second] = parts;
        const date = new Date(year, month - 1, day, hour, minute, second || 0);
        return date.toLocaleString(undefined, {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });
      } catch {
        return match;
      }
    }
  );
};

/* ================================
 * Logging Level Colors
 * ================================ */

const LEVEL_COLOR_MAP: Record<string, string> = {
  CRITICAL: 'error.dark',
  ERROR: 'error.main',
  WARNING: 'warning.main',
  INFO: 'info.main',
  DEBUG: 'success.main',
  NOTSET: 'primary.main'
};

export const getLevelColor = (level: string): string =>
  LEVEL_COLOR_MAP[level.toUpperCase()] ?? LEVEL_COLOR_MAP.NOTSET;

const applyFunction = (name: string) => {
  return (view: any, completion: any, from: number, to: number) => {
    view.dispatch({
      changes: { from, to, insert: `${name}()` },
      selection: { anchor: from + name.length + 1 }
    });
  };
};

export const yamlWithEmbeddedJS = (keyNames: string[] = ['code']) => {
  const jsParser = javascript({ jsx: true, typescript: true }).language.parser;

  // 1. Reconfigure the base YAML parser with the mixed-language logic
  const mixedYamlParser = yamlLanguage.parser.configure({
    wrap: parseMixed((node, input) => {
      // Look for YAML values (Literal or BlockLiteral)
      if (node.name === 'Literal' || node.name === 'BlockLiteral') {
        const parent = node.node.parent;

        // Ensure the value belongs to a 'Pair'
        if (parent?.name === 'Pair') {
          const keyNode = parent.getChild('Key');
          if (keyNode) {
            const keyName = input.read(keyNode.from, keyNode.to).trim();
            // Match the specific key "code:"
            if (keyNames.includes(keyName)) {
              return { parser: jsParser };
            }
          }
        }
      }
      return null;
    })
  });

  // 2. Use the STATIC LRLanguage.define method to create the new language
  const mixedYamlLanguage = LRLanguage.define({
    name: 'yaml-mixed',
    parser: mixedYamlParser,
    languageData: yamlLanguage.data // Inherit YAML metadata (comments, etc.)
  });

  return new LanguageSupport(mixedYamlLanguage);
};

/* ================================
 * Jinja Completion Builder
 * ================================ */

export class JinjaCompletionBuilder {
  static buildGlobals(globals: Record<string, any> = []) {
    return Object.entries(globals).map(([label, meta]) => ({
      label,
      type: meta.type,
      detail: 'global',
      section: 'Globals',
      info: `${meta.signature}\n\n${meta.doc ?? ''}`,
      apply: meta.type === 'function' ? applyFunction(label) : label
    }));
  }

  static buildFilters(filters: Record<string, any> = {}) {
    return Object.entries(filters).map(([label, meta]) => ({
      label,
      type: 'function',
      detail: 'filter',
      section: 'Filters',
      info: `${meta.signature}\n\n${meta.doc ?? ''}`
    }));
  }

  static buildTests(tests: string[] = []) {
    return tests.map((name) => ({
      label: name,
      type: 'keyword',
      detail: 'test',
      section: 'Tests'
    }));
  }

  static buildTags(tags: string[] = []) {
    return tags.map((name) => ({
      label: name,
      type: 'keyword',
      detail: 'tag',
      section: 'Tags'
    }));
  }

  static buildTopLevelVariables(params: Record<string, any> = {}) {
    return Object.keys(params).map((key) => ({
      label: key,
      type: 'variable',
      detail: 'param',
      section: 'Variables'
    }));
  }

  static buildProperties(params: Record<string, any> = {}) {
    return (path: readonly string[]) => {
      const value = _.get(params, path);
      if (!_.isPlainObject(value)) return [];

      return Object.keys(value).map((key) => ({
        label: key,
        type: 'property',
        detail: 'param',
        section: 'Properties'
      }));
    };
  }

  static build(
    params: Record<string, any> = {},
    envDoc: EnvDoc
  ): JinjaCompletionConfig {
    return {
      variables: [
        ...this.buildTopLevelVariables(params),
        ...this.buildGlobals(envDoc.globals),
        ...this.buildTests(envDoc.tests)
      ],
      // @ts-ignore : this is custom patched
      filters: this.buildFilters(envDoc.filters),
      tags: this.buildTags(envDoc.tags),
      properties: this.buildProperties(params)
    };
  }
}

type JinjaSymbols = {
  globals: Globals;
  filters: Globals;
};

export const jinjaLinter = (
  params: Record<string, any>,
  symbols: JinjaSymbols
) => {
  return linter((view) => {
    const diagnostics: Diagnostic[] = [];
    const definitions = new Set<string>(['this']);
    const cursor = syntaxTree(view.state).cursor();

    do {
      const { node } = cursor;
      const text = view.state.doc.sliceString(node.from, node.to);

      switch (node.name) {
        case 'Definition':
          definitions.add(text);
          break;

        case 'VariableName':
          if (node.parent?.name === 'NamedArgument') {
            // if left key and value is False, True, None then return
            if (
              node.cursor().nextSibling() ||
              text === 'False' ||
              text === 'True' ||
              text === 'None'
            ) {
              break;
            }
          }

          if (
            !definitions.has(text) &&
            !params[text] &&
            !symbols.globals[text]
          ) {
            diagnostics.push({
              from: node.from,
              to: node.to,
              severity: 'warning',
              message: `${node.name} "${text}" is not defined`
            });
          }
          break;

        case 'FilterName':
          if (!symbols.filters[text]) {
            diagnostics.push({
              from: node.from,
              to: node.to,
              severity: 'warning',
              message: `${node.name} "${text}" is not defined`
            });
          }
          break;
      }
    } while (cursor.next());

    return diagnostics;
  });
};

const initEsBuild: Promise<typeof esbuild> = (async () => {
  await esbuild.initialize({
    wasmURL: wasmUrl,
    worker: true
  });
  console.log('ESBuild initialized');
  return esbuild;
})();

initEsBuild;
export async function transpile(code: string): Promise<string> {
  const esbuild = await initEsBuild;

  // 2️⃣ Compile with strict constraints
  const result = await esbuild.transform(code, {
    loader: 'tsx',
    format: 'esm',
    platform: 'browser',
    target: 'es2020',

    // Lock down JSX
    jsx: 'transform',
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',

    // Reduce attack surface
    minify: true,
    treeShaking: true,

    // Prevent sneaky globals, just avoid by mistake
    define: {
      eval: 'undefined',
      Function: 'undefined',
      window: 'undefined',
      document: 'undefined',
      globalThis: 'undefined',
      fetch: 'undefined',
      WebSocket: 'undefined',
      XMLHttpRequest: 'undefined'
    },

    // Make output deterministic
    keepNames: false,
    sourcemap: false
  });

  return result.code;
}

const initPyodide: Promise<PyodideAPI> = (async () => {
  // @ts-ignore
  const pyodide: PyodideAPI = await loadPyodide();
  // Ensure Jinja2 is available
  await pyodide.loadPackage('jinja2');
  await pyodide.runPythonAsync(jinja);
  console.log('Pyodide initialized');
  return pyodide;
})();

// pre-init at background for faster load
initPyodide;
type EnvDoc = {
  filters: Record<string, unknown>;
  globals: Record<string, unknown>;
  tests: string[];
  tags: string[];
};

const envDocPromise: Promise<EnvDoc> = (async () => {
  const pyodide = await initPyodide;
  const envDoc = JSON.parse(pyodide.globals.get('doc_json'));
  return Object.freeze(envDoc);
})();

export const getEnvDoc = async (globals: Record<string, unknown>) => {
  const envDoc = await envDocPromise;
  return { ...envDoc, globals: { ...envDoc.globals, ...globals } };
};

const extractUndeclaredVariables = async (
  tpl: string,
  data: {
    [key: string]: any;
  }
): Promise<string[] | string> => {
  const pyodide = await initPyodide;
  const renderFn = pyodide.globals.get('render');
  const params = renderFn(
    tpl,
    pyodide.toPy(data),
    pyodide.toPy(window.ctx ?? {})
  );
  return typeof params === 'string' ? params : Array.from(params.toJs());
};

export const buildJinjaContext = (
  packageName: string,
  params: {
    [key: string]: any;
  },
  raw: boolean = false
) => {
  return (
    tmpl: string,
    context: {
      [key: string]: any;
    }
  ) => jinjaEvaluate(packageName, tmpl, { ...params, ...context }, raw);
};

export const jinjaEvaluate = async (
  packageName: string,
  tmpl: string,
  params: {
    [key: string]: any;
  },
  raw = false
) => {
  // extract includeKeys to pass to server
  const includeKeys = await extractUndeclaredVariables(tmpl, params);
  const result =
    typeof includeKeys === 'string'
      ? includeKeys
      : await api.renderTemplate(
          packageName,
          tmpl,
          includeKeys.includes('this') ? params : _.pick(params, includeKeys)
        );

  if (!raw) {
    try {
      return json5.parse(result);
    } catch {}
  }
  // not a string, return as is
  return result;
};

export const transformSignals = (signals: Signal[]) => {
  return signals.map((signal) => ({
    offset: signal.id,
    matched_entry: {
      id: signal.id,
      timestamp: new Date(signal.created_at).toLocaleString(),
      level: 'INFO',
      message: signal.message || ''
    },
    following_entries: []
  }));
};

export const makeTablesSortable = (tables: NodeListOf<HTMLTableElement>) => {
  tables.forEach((table) => {
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');
    if (!thead || !tbody) return;

    const headers = Array.from(thead.querySelectorAll('th'));

    headers.forEach((th, columnIndex) => {
      let direction: 'asc' | 'desc' = 'asc';

      th.setAttribute('aria-sort', 'none');

      th.onclick = () => {
        const rows = Array.from(tbody.querySelectorAll('tr'));

        const sorted = rows.sort((a, b) => {
          const aText = a.children[columnIndex]?.textContent?.trim() ?? '';
          const bText = b.children[columnIndex]?.textContent?.trim() ?? '';

          const aNum = Number(aText);
          const bNum = Number(bText);
          const isNumeric = !Number.isNaN(aNum) && !Number.isNaN(bNum);

          if (isNumeric) {
            return direction === 'asc' ? aNum - bNum : bNum - aNum;
          }

          return direction === 'asc'
            ? aText.localeCompare(bText)
            : bText.localeCompare(aText);
        });

        // reset other headers
        headers.forEach((h) => h.setAttribute('aria-sort', 'none'));

        direction = direction === 'asc' ? 'desc' : 'asc';
        th.setAttribute('aria-sort', direction);

        sorted.forEach((tr) => tbody.appendChild(tr));
      };
    });
  });
};

const renderAlertHTML = (message: string) => `
  <div
    role="alert"
    class="MuiAlert-root MuiAlert-standardError MuiAlert-standard"
    style="
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 16px;
      margin: 8px 0;
      border-radius: 4px;
      background-color: var(--alert-bg);
      color: var(--alert-text);
      font-family: Roboto, Helvetica, Arial, sans-serif;
      font-size: 0.875rem;
      line-height: 1.43;
    "
  >
    <div
      class="MuiAlert-icon"
      style="
        margin-top: 2px;
        color: var(--alert-icon);
        font-size: 22px;
        display: flex;
      "
    >
      &#9888;
    </div>

    <div class="MuiAlert-message">
      <strong style="font-weight: 500;">Chart error</strong><br />
      ${message}
    </div>
  </div>
`;

export const makeCanvasCharts = (canvases: NodeListOf<HTMLCanvasElement>) => {
  const charts = [];

  canvases.forEach((canvas: HTMLCanvasElement, index) => {
    try {
      const raw = canvas.textContent?.trim();
      if (!raw) return;
      // this is for human typing, not serialization
      const config = json5.parse(raw);
      canvas.textContent = '';

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      charts.push(new Chart(ctx, config));
    } catch (err) {
      console.error('Invalid chart JSON:', err);
      const alertHTML = renderAlertHTML(
        err instanceof Error ? err.message : 'Invalid chart configuration'
      );

      canvas.replaceWith(
        document.createRange().createContextualFragment(alertHTML)
      );
    }
  });

  return charts;
};

/* ---------------- blob cache ---------------- */

const blobCache = new Map<string, string>();
const gzipPrefix = 'data:application/gzip;base64,';

async function decodeGzip(base64: string) {
  // base64 → bytes
  const compressed = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

  // gunzip
  const stream = new Blob([compressed]).stream();
  const decompressedStream = stream.pipeThrough(
    new DecompressionStream('gzip')
  );

  return await new Response(decompressedStream).text();
}

export const createUrlFromString = (code: string) => {
  const hash = getCodeHash(code);

  let url = blobCache.get(hash);
  if (url) return url;

  const blob = new Blob([code], {
    type: 'application/javascript'
  });

  url = URL.createObjectURL(blob);
  blobCache.set(hash, url);

  return url;
};

// known at build time
// Define the shape of your expected module
const libModules = import.meta.env.DEV
  ? import.meta.glob('../libs/*.{ts,js,tsx,jsx}')
  : {};

const loadModule = (modUrl: string) => import(/* @vite-ignore */ modUrl);

export const getModule = async ({
  url,
  code
}: CodeSchema): Promise<ModuleCode> => {
  let loader: Promise<any>;
  if (code) {
    loader = loadModule(createUrlFromString(await transpile(code)));
  } else if (url.startsWith(gzipPrefix)) {
    loader = loadModule(
      createUrlFromString(await decodeGzip(url.slice(gzipPrefix.length)))
    );
  } else {
    loader = libModules[`../libs/${url}`]?.() ?? loadModule(url);
  }

  if (!loader) {
    throw new Error('Module loader is undefined');
  }

  const mod = await loader;
  return mod;
};
