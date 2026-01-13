import json5 from 'json5';
import { linter, Diagnostic } from '@codemirror/lint';
import { syntaxTree } from '@codemirror/language';
import _ from 'lodash';
import api from './api';

// Helper to resolve $ref schema if present
const resolveRef = (schema: any, ref: string) => {
  if (!schema.$defs || !ref) return null;
  const defKey = ref.replace('#/$defs/', '');
  return schema.$defs[defKey] ?? null;
};

export const buildUiSchemaWithExpr = async (
  packageName: string,
  filters: string[],
  context: Record<string, any>,
  schema: any,
  changedFieldId: string
): Promise<any> => {
  if (!schema) return schema;

  const newSchema = _.cloneDeep(schema);
  const stack = [{ node: newSchema }];

  while (stack.length) {
    const { node } = stack.pop()!;

    if (node['ui:expr']) {
      const [expr, ...deps]: string[] =
        typeof node['ui:expr'] === 'string'
          ? [node['ui:expr']]
          : node['ui:expr'].map((c: string | string[]) =>
              typeof c === 'string' ? c : c.join('.')
            );

      // only render if deps changed, or first time when no changedFieldId
      if (
        deps.length === 0 ||
        !changedFieldId ||
        deps.includes(changedFieldId)
      ) {
        const extraOptions = await jinjaEvaluate(packageName, expr, filters, {
          ...context,
          this: node // binding this context as well
        });
        _.merge(node, extraOptions);
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

  return newSchema;
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
        if (uiKey.startsWith('ui:') && uiKey !== 'ui:expr') {
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

export const formatMessage = (message: unknown): unknown => {
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
    return (path: string | string[]) => {
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

  static build(params: Record<string, any> = {}, serverSymbols: any = {}) {
    return {
      variables: [
        ...this.buildTopLevelVariables(params),
        ...this.buildGlobals(serverSymbols.globals),
        ...this.buildTests(serverSymbols.tests)
      ],
      filters: this.buildFilters(serverSymbols.filters),
      tags: this.buildTags(serverSymbols.tags),
      properties: this.buildProperties(params)
    };
  }
}

type JinjaSymbols = {
  globals: Record<string, any>;
  filters: Record<string, any>;
};

export const jinjaLinter = (
  params: Record<string, any>,
  symbols: JinjaSymbols
) => {
  return linter((view) => {
    const diagnostics: Diagnostic[] = [];
    const definitions = new Set<string>();
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

export const initPyodide = new Promise(async (resolve) => {
  // @ts-ignore
  const pyodide = await loadPyodide();

  // Ensure Jinja2 is available
  await pyodide.loadPackage('jinja2');

  // Define Python code
  await pyodide.runPythonAsync(`
from jinja2 import Environment, meta
def extract_undeclared_variables(tpl_str, context, filters):
    env = Environment(autoescape=False, trim_blocks=True, lstrip_blocks=True)
    try:                
        return env.from_string(tpl_str).render(context)
    except:
        identity = lambda x, *args, **kwargs: x
        env.filters.update({name: identity for name in filters})
        ast = env.parse(tpl_str)
        return meta.find_undeclared_variables(ast)
  `);
  console.log('Pyodide initialized');
  resolve(pyodide);
});

export const extractUndeclaredVariables = async (
  tpl: string,
  data: {
    [key: string]: any;
  },
  filters: Set<string>
): Promise<string[] | string> => {
  const pyodide = await initPyodide;
  // @ts-ignore
  const extractFn = pyodide.globals.get('extract_undeclared_variables');
  // @ts-ignore
  const params = extractFn(tpl, pyodide.toPy(data), filters);
  return typeof params === 'string' ? params : Array.from(params.toJs());
};

export const buildJinjaContext = (
  packageName: string,
  filters: string[] | { [key: string]: any },
  params: {
    [key: string]: any;
  }
) => {
  return (
    tmpl: string,
    context: {
      [key: string]: any;
    }
  ) => jinjaEvaluate(packageName, tmpl, filters, { ...params, ...context });
};

export const jinjaEvaluate = async (
  packageName: string,
  tmpl: string,
  filters: string[] | { [key: string]: any },
  params: {
    [key: string]: any;
  }
) => {
  // extract includeKeys to pass to server
  let includeKeys = await extractUndeclaredVariables(
    tmpl,
    params,
    new Set(typeof filters === 'object' ? Object.keys(filters) : filters)
  );

  const { result } =
    typeof includeKeys === 'string'
      ? { result: includeKeys }
      : await api.renderTemplate(
          packageName,
          tmpl,
          _.pick(params, includeKeys)
        );

  if (typeof result === 'string') {
    try {
      return json5.parse(result);
    } catch {}
  }
  // not a string, return as is
  return result;
};
// pre-init at background for faster load
initPyodide;
