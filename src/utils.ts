import jsep, { Expression } from 'jsep';
import { linter, Diagnostic } from '@codemirror/lint';
import { syntaxTree } from '@codemirror/language';
import _ from 'lodash';
import { SyntaxNode, TreeCursor } from '@lezer/common';

/* ================================
 * AST Evaluation
 * ================================ */

type Context = Record<string, any>;

interface StackItem {
  node: any;
  visited: boolean;
}

const evalAstIterative = (
  root: any,
  context: Context,
  maxSteps: number
): any => {
  const stack: StackItem[] = [{ node: root, visited: false }];
  const values = new Map<any, any>();
  let steps = 0;

  while (stack.length) {
    if (++steps > maxSteps) {
      throw new Error('Evaluation step limit exceeded');
    }

    const item = stack.pop()!;
    const node = item.node;

    if (!item.visited) {
      stack.push({ node, visited: true });

      switch (node.type) {
        case 'UnaryExpression':
          stack.push({ node: node.argument, visited: false });
          break;

        case 'BinaryExpression':
        case 'LogicalExpression':
          stack.push({ node: node.right, visited: false });
          stack.push({ node: node.left, visited: false });
          break;

        case 'ConditionalExpression':
          stack.push({ node: node.alternate, visited: false });
          stack.push({ node: node.consequent, visited: false });
          stack.push({ node: node.test, visited: false });
          break;

        case 'MemberExpression':
          if (node.computed) {
            stack.push({ node: node.property, visited: false });
          }
          stack.push({ node: node.object, visited: false });
          break;

        case 'Compound':
          if (node.body?.[0]?.name === 'return') {
            stack.push({ node: node.body[1], visited: false });
          } else {
            throw new Error(`Unsupported node ${node.body?.[0]?.name}`);
          }
          break;
      }
    } else {
      let result: any;

      switch (node.type) {
        case 'Literal':
          result = node.value;
          break;

        case 'Identifier':
          if (!(node.name in context)) {
            throw new Error(`Unknown identifier: ${node.name}`);
          }
          result = context[node.name];
          break;

        case 'UnaryExpression': {
          const arg = values.get(node.argument);
          switch (node.operator) {
            case '+':
              result = +arg;
              break;
            case '-':
              result = -arg;
              break;
            case '!':
              result = !arg;
              break;
            default:
              throw new Error(`Unsupported unary ${node.operator}`);
          }
          break;
        }

        case 'BinaryExpression': {
          const left = values.get(node.left);
          const right = values.get(node.right);

          switch (node.operator) {
            case '+':
              result = left + right;
              break;
            case '-':
              result = left - right;
              break;
            case '*':
              result = left * right;
              break;
            case '/':
              result = left / right;
              break;
            case '%':
              result = left % right;
              break;
            case '==':
              result = left == right;
              break;
            case '===':
              result = left === right;
              break;
            case '!=':
              result = left != right;
              break;
            case '!==':
              result = left !== right;
              break;
            case '<':
              result = left < right;
              break;
            case '<=':
              result = left <= right;
              break;
            case '>':
              result = left > right;
              break;
            case '>=':
              result = left >= right;
              break;
            default:
              throw new Error(`Unsupported operator ${node.operator}`);
          }
          break;
        }

        case 'LogicalExpression': {
          const left = values.get(node.left);
          if (node.operator === '&&') {
            result = left && values.get(node.right);
          } else if (node.operator === '||') {
            result = left || values.get(node.right);
          } else {
            throw new Error(`Unsupported logical ${node.operator}`);
          }
          break;
        }

        case 'ConditionalExpression':
          result = values.get(node.test)
            ? values.get(node.consequent)
            : values.get(node.alternate);
          break;

        case 'MemberExpression': {
          const obj = values.get(node.object);
          const prop = node.computed
            ? values.get(node.property)
            : node.property.name;
          result = obj?.[prop];
          break;
        }

        case 'Compound':
          result = values.get(node.body[1]);
          break;

        default:
          throw new Error(`Unsupported node type ${node.type}`);
      }

      values.set(node, result);
    }
  }

  return values.get(root);
};

/* ================================
 * UI Schema Extraction
 * ================================ */

export const extractUiSchema = (schema: any): Record<string, any> => {
  if (!schema || !schema.properties) return {};

  const uiSchema: Record<string, any> = {
    'ui:submitButtonOptions': {
      norender: true
    }
  };

  const stack: Array<{
    props: Record<string, any>;
    target: Record<string, any>;
    path: string[];
  }> = [
    {
      props: schema.properties,
      target: uiSchema,
      path: []
    }
  ];

  while (stack.length > 0) {
    const { props, target, path } = stack.pop()!;

    for (const [key, prop] of Object.entries<any>(props)) {
      const uiEntry: Record<string, any> = {};

      for (const uiKey in prop) {
        if (uiKey.startsWith('ui:')) {
          uiEntry[uiKey] = prop[uiKey];
        }
      }

      let nestedProps: Record<string, any> | null = null;

      if (prop.type === 'object' && prop.properties) {
        nestedProps = prop.properties;
      } else if (prop.$ref) {
        const defKey = prop.$ref.replace('#/$defs/', '');
        const defSchema = schema.$defs?.[defKey];
        if (defSchema?.type === 'object' && defSchema.properties) {
          nestedProps = defSchema.properties;
        }
      }

      if (nestedProps) {
        target[key] = uiEntry;
        stack.push({
          props: nestedProps,
          target: target[key],
          path: [...path, key]
        });
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

/* ================================
 * Expression Evaluation
 * ================================ */

const cache = new Map<string, Expression>();

const applyFunction = (name: string) => {
  return (view: any, completion: any, from: number, to: number) => {
    view.dispatch({
      changes: { from, to, insert: `${name}()` },
      selection: { anchor: from + name.length + 1 }
    });
  };
};

export const evaluate = (
  expr: unknown,
  context: Context,
  defaultValue: any,
  maxSteps = 256
): any => {
  if (expr === undefined || expr === null) return defaultValue;

  try {
    const val = typeof expr === 'string' ? expr : String(expr);
    let ast = cache.get(val);

    if (!ast) {
      ast = jsep(val);
      cache.set(val, ast);
    }

    return evalAstIterative(ast, context, maxSteps);
  } catch (err: any) {
    console.log('Evaluation error:', err.message);
    return defaultValue;
  }
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

type JinjaSymbols = ReturnType<typeof JinjaCompletionBuilder.build>;

export const jinjaLinter = (symbols: JinjaSymbols) => {
  // Cache symbols lookups in Sets for O(1) checking
  const variableLabels = new Set(symbols.variables.map((v) => v.label));
  const filterLabels = new Set(symbols.filters.map((f) => f.label));

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

          if (!definitions.has(text) && !variableLabels.has(text)) {
            diagnostics.push({
              from: node.from,
              to: node.to,
              severity: 'warning',
              message: `${node.name} "${text}" is not defined`
            });
          }
          break;

        case 'FilterName':
          if (!filterLabels.has(text)) {
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
