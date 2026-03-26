import json5 from 'json5';
import { linter, Diagnostic } from '@codemirror/lint';
import { LanguageDescription, syntaxTree } from '@codemirror/language';
import _ from 'lodash';
import api from './api';
import { LanguageSupport, LRLanguage } from '@codemirror/language';
import { parseMixed } from '@lezer/common';
import { javascript } from '@codemirror/lang-javascript';
import { yamlLanguage } from '@codemirror/lang-yaml';
import { json } from '@codemirror/lang-json';
import { PostgreSQL, sql, SQLNamespace } from '@codemirror/lang-sql';
import { markdown } from '@codemirror/lang-markdown';
import { jinja, JinjaCompletionConfig } from '@codemirror/lang-jinja';
import dayjs from 'dayjs';
import { FieldError, RJSFSchema } from '@rjsf/utils';
import { PaletteMode } from '@mui/material';
import { TFunction } from 'i18next';
import { render } from './jinja';
import { loadModule } from './module';

export const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
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

export type TypeofResult =
  | 'string'
  | 'number'
  | 'boolean'
  | 'bigint'
  | 'symbol'
  | 'undefined'
  | 'object'
  | 'function';

export const convertByType = (value: string, type: TypeofResult) => {
  switch (type) {
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

type NodeCallback = (node: AnyObject) => void | Promise<void>;

/**
 * Recursively traverse a JSON schema and apply a callback to each node.
 */
export const traverseSchema = async (
  schema: RJSFSchema,
  callback: NodeCallback,
): Promise<RJSFSchema> => {
  if (!schema) return schema;

  const newSchema = _.cloneDeep(schema);
  const stack = [{ node: newSchema }];

  while (stack.length) {
    const { node } = stack.pop()!;

    await callback(node); // apply logic for this node

    // Traverse children
    if (node.type === 'object' && node.properties) {
      for (const child of Object.values(node.properties)) {
        stack.push({ node: child as RJSFSchema });
      }
    }

    // Resolve $ref if needed
    if (node.$ref) {
      const refSchema = resolveRef(newSchema, node.$ref);
      if (refSchema) stack.push({ node: refSchema });
    }
  }

  return newSchema;
};

export const translateSchema = (
  schema: RJSFSchema,
  t: TFunction,
  uiKeysToTranslate: string[] = ['title', 'description', 'placeholder', 'help'],
) => {
  return traverseSchema(schema, (node) => {
    for (const key of uiKeysToTranslate) {
      if (key in node && typeof node[key] === 'string') {
        node[key] = t(node[key].toLowerCase());
      }
    }
  });
};

export const buildUiSchemaWithExpr = async (
  packageName: string,
  context: AnyObject,
  schema: RJSFSchema,
  changedFieldId?: string,
): Promise<[RJSFSchema, FieldError[]]> => {
  const errors: string[] = [];

  const newSchema = await traverseSchema(schema, async (node) => {
    for (const [sKey, sValue] of Object.entries(node)) {
      if (sKey.startsWith('ui:expr')) {
        const [expr, deps] =
          typeof sValue === 'string'
            ? [sValue]
            : (sValue as [string, string[]]);

        if (!deps || !changedFieldId || deps.includes(changedFieldId)) {
          const subKey = sKey === 'ui:expr' ? '' : sKey.replace('ui:expr:', '');
          try {
            const extraOptions = await jinjaEvaluate(
              packageName,
              expr,
              context,
              !!subKey,
            );

            if (subKey) {
              node[subKey] = convertByType(extraOptions, typeof node[subKey]);
            } else {
              Object.assign(node, extraOptions);
            }
          } catch (ex: any) {
            errors.push(ex.message);
          }
        }
      }
    }
  });

  return [newSchema, errors];
};

/* ================================
 * Theme
 * ================================ */

export const getSystemTheme = (): PaletteMode =>
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
          hour12: true,
        });
      } catch {
        return match;
      }
    },
  );
};

export const formatUtcTime = (isoString: any): string => {
  if (isoString === null || isoString === undefined) return '-';
  if (typeof isoString !== 'string') return String(isoString);

  try {
    // Check if it looks like an ISO date (basic check)
    // 2026-01-30T14:26:20+07:00 or 2026-01-30T14:26:20Z
    if (!/^\d{4}-\d{2}-\d{2}T/.test(isoString)) return isoString;

    const dt = dayjs.utc(isoString);
    if (!dt.isValid()) return isoString;
    return dt.format('YYYY-MM-DD HH:mm UTC');
  } catch {
    return isoString;
  }
};

/* ================================
 * Logging Level Colors
 * ================================ */

const LEVEL_COLOR_MAP: Record<string, string> = {
  CRITICAL: 'error.main',
  ERROR: 'error.main',
  WARNING: 'warning.main',
  INFO: 'info.main',
  DEBUG: 'success.main',
  NOTSET: 'primary.main',
};

export const getLevelColor = (level: string): string =>
  LEVEL_COLOR_MAP[level.toUpperCase()] ?? LEVEL_COLOR_MAP.NOTSET;

const applyFunction = (name: string) => {
  return (view: any, completion: any, from: number, to: number) => {
    view.dispatch({
      changes: { from, to, insert: `${name}()` },
      selection: { anchor: from + name.length + 1 },
    });
  };
};

export const yamlWithEmbeddedJS = (keyNames: string[] = ['code']) => {
  const jsParser = javascriptLang.language.parser;

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
    }),
  });

  // 2. Use the STATIC LRLanguage.define method to create the new language
  const mixedYamlLanguage = LRLanguage.define({
    name: 'yaml-mixed',
    parser: mixedYamlParser,
    languageData: yamlLanguage.data, // Inherit YAML metadata (comments, etc.)
  });

  return new LanguageSupport(mixedYamlLanguage);
};

/* ================================
 * Jinja Completion Builder
 * ================================ */

export class JinjaCompletionBuilder {
  static buildGlobals(globals: AnyObject = []) {
    return Object.entries(globals).map(([label, meta]) => ({
      label,
      type: meta.type,
      detail: 'global',
      section: 'Globals',
      info: `${meta.signature}\n\n${meta.doc ?? ''}`,
      apply: meta.type === 'function' ? applyFunction(label) : label,
    }));
  }

  static buildFilters(filters: AnyObject = {}) {
    return Object.entries(filters).map(([label, meta]) => ({
      label,
      type: 'function',
      detail: 'filter',
      section: 'Filters',
      info: `${meta.signature}\n\n${meta.doc ?? ''}`,
    }));
  }

  static buildTests(tests: string[] = []) {
    return tests.map((name) => ({
      label: name,
      type: 'keyword',
      detail: 'test',
      section: 'Tests',
    }));
  }

  static buildTags(tags: string[] = []) {
    return tags.map((name) => ({
      label: name,
      type: 'keyword',
      detail: 'tag',
      section: 'Tags',
    }));
  }

  static buildTopLevelVariables(params: AnyObject = {}) {
    return Object.keys(params).map((key) => ({
      label: key,
      type: 'variable',
      detail: 'param',
      section: 'Variables',
    }));
  }

  static buildProperties(params: AnyObject = {}) {
    return (path: readonly string[]) => {
      const value = _.get(params, path);
      if (!_.isPlainObject(value)) return [];

      return Object.keys(value).map((key) => ({
        label: key,
        type: 'property',
        detail: 'param',
        section: 'Properties',
      }));
    };
  }

  static build(params: AnyObject = {}, envDoc: EnvDoc): JinjaCompletionConfig {
    return {
      variables: [
        ...this.buildTopLevelVariables(params),
        ...this.buildGlobals(envDoc.globals),
        ...this.buildTests(envDoc.tests),
      ],
      // @ts-ignore : this is custom patched
      filters: this.buildFilters(envDoc.filters),
      tags: this.buildTags(envDoc.tags),
      properties: this.buildProperties(params),
    };
  }
}

export const jinjaLinter = (params: AnyObject, symbols: EnvDoc) => {
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
          if (
            node.parent?.name === 'NamedArgument' &&
            node.cursor().nextSibling()
          ) {
            break;
          }
          // if left key and value is False, True, None then return
          if (text === 'False' || text === 'True' || text === 'None') {
            break;
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
              message: `${node.name} "${text}" is not defined`,
            });
          }
          break;

        case 'FilterName':
          if (!symbols.filters[text]) {
            diagnostics.push({
              from: node.from,
              to: node.to,
              severity: 'warning',
              message: `${node.name} "${text}" is not defined`,
            });
          }
          break;
      }
    } while (cursor.next());

    return diagnostics;
  });
};

const getEsbuild = () => {
  if (!globalThis.__ESBUILD_PROMISE__) {
    globalThis.__ESBUILD_PROMISE__ = (async () => {
      const esbuild = await import('esbuild-wasm');

      await esbuild.initialize({
        wasmURL: 'https://unpkg.com/esbuild-wasm@0.27.2/esbuild.wasm',
        worker: true,
      });

      console.log('ESBuild initialized');

      return esbuild;
    })();
  }
  return globalThis.__ESBUILD_PROMISE__;
};

export async function transpile(code: string): Promise<string> {
  const esbuild = await getEsbuild();

  // 2️⃣ Compile with strict constraints
  const result = await esbuild.transform(code, {
    loader: 'tsx',
    format: 'esm',
    platform: 'browser',
    target: 'esnext',

    // Lock down JSX
    jsx: 'transform',
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',

    minify: false,
    treeShaking: false,
    keepNames: false,
    sourcemap: false,

    legalComments: 'none',
  });

  return result.code;
}

export const buildJinjaContext = (
  packageName: string,
  params: {
    [key: string]: any;
  },
  raw: boolean = false,
) => {
  return (
    tmpl: string,
    context: {
      [key: string]: any;
    },
  ) => jinjaEvaluate(packageName, tmpl, { ...params, ...context }, raw);
};

export const jinjaEvaluate = async (
  packageName: string,
  tmpl: string,
  params: {
    [key: string]: any;
  } = {},
  raw = false,
) => {
  // extract includeKeys to pass to server
  const includeKeys = render(tmpl, params, window.ctx);
  const result =
    typeof includeKeys === 'string'
      ? includeKeys
      : await api.renderTemplate(
          packageName,
          tmpl,
          includeKeys.includes('this') ? params : _.pick(params, includeKeys),
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
      message: signal.message || '',
    },
    following_entries: [],
  }));
};

/* ---------------- blob cache ---------------- */

const blobCache = new Map<string, string>();
export const createUrlFromString = async (code: string, isES = false) => {
  // hash from trimmed string
  const hash = getCodeHash(code.trim());

  let url = blobCache.get(hash);
  if (url) return url;

  const blob = new Blob([code], {
    type: 'application/javascript',
  });
  url = URL.createObjectURL(blob);
  if (!isES) {
    try {
      await loadModule(url);
    } catch {
      // fallback with ES module
      return createUrlFromString(await transpile(code), true);
    }
  }
  blobCache.set(hash, url);
  return url;
};

// export language to re-use
export const jsonLang = json();
export const sqlLang = sql({ dialect: PostgreSQL });
export const javascriptLang = javascript({ jsx: true, typescript: true });
export const yamlLang = yamlWithEmbeddedJS();

const languageByType = {
  json: jsonLang,
  yml: yamlLang,
  yaml: yamlLang,
  sql: sqlLang,
  module: javascriptLang,
  js: javascriptLang,
};

// markdown lang can display custom code but not jinja, because jinja is at top
export const markdownLang = markdown({
  codeLanguages: Object.entries(languageByType).map(([name, support]) =>
    LanguageDescription.of({ name, support }),
  ),
});

// default jinja is markdown to display dynamic content
export const jinjaLang = jinja({ base: markdownLang });

export const resolveLanguageExtension = (
  lang: string,
  schema?: SQLNamespace,
): LanguageSupport => {
  // sql with custom meta
  if (lang === 'sql') {
    return schema ? sql({ dialect: PostgreSQL, schema }) : sqlLang;
  }

  if (lang === 'markdown') return markdownLang;

  return languageByType[lang];
};
