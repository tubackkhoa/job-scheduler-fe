import jsep, { Expression } from 'jsep';
import nunjucks from 'nunjucks';
import jsepObject from '@jsep-plugin/object';
import jsepAsyncAwait from '@jsep-plugin/async-await';
import { linter, Diagnostic } from '@codemirror/lint';
import { syntaxTree } from '@codemirror/language';
import _ from 'lodash';

// register object
jsep.plugins.register(jsepObject, jsepAsyncAwait);
/* ================================
 * AST Evaluation
 * ================================ */

type Context = Record<string, any>;

interface StackItem {
  node: any;
  visited: boolean;
}

const evalAstIterative = async (
  root: any,
  context: any,
  maxSteps: number
): Promise<any> => {
  type StackItem = { node: any; visited: boolean };
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
        case 'AwaitExpression':
          stack.push({ node: node.argument, visited: false });
          break;

        case 'CallExpression':
          // Push arguments in reverse order so they're evaluated left-to-right
          for (let i = node.arguments.length - 1; i >= 0; i--) {
            stack.push({ node: node.arguments[i], visited: false });
          }
          stack.push({ node: node.callee, visited: false });
          break;

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

        case 'ObjectExpression':
          for (const prop of node.properties) {
            stack.push({ node: prop.value, visited: false });
          }
          for (const prop of node.properties) {
            if (prop.computed) {
              stack.push({ node: prop.key, visited: false });
            }
          }
          break;

        default:
          // No children to push
          break;
      }
    } else {
      let result: any;

      switch (node.type) {
        case 'AwaitExpression':
          // Await the resolved value of the argument
          result = await values.get(node.argument);
          break;

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

        case 'CallExpression': {
          // Evaluate callee and arguments then call it
          const fn = values.get(node.callee);
          const args = node.arguments.map((arg: any) => values.get(arg));

          if (typeof fn !== 'function') {
            throw new Error('CallExpression callee is not a function');
          }

          // Await if the function returns a Promise (handle async calls)
          result = fn(...args);
          if (result instanceof Promise) {
            result = await result;
          }
          break;
        }

        case 'Compound':
          result = values.get(node.body[1]);
          break;

        case 'ObjectExpression': {
          result = {};
          for (const prop of node.properties) {
            let key: string;
            if (prop.key.type === 'Identifier') {
              key = prop.key.name;
            } else if (prop.key.type === 'Literal') {
              key = String(prop.key.value);
            } else {
              throw new Error(`Unsupported object key type ${prop.key.type}`);
            }
            const value = values.get(prop.value);
            result[key] = value;
          }
          break;
        }

        default:
          throw new Error(`Unsupported node type ${node.type}`);
      }

      values.set(node, result);
    }
  }

  return values.get(root);
};

// Helper to resolve $ref schema if present
const resolveRef = (schema: any, ref: string) => {
  if (!schema.$defs || !ref) return null;
  const defKey = ref.replace('#/$defs/', '');
  return schema.$defs[defKey] ?? null;
};

export const buildUiSchemaWithExpr = async (
  schema: any,
  data: any
): Promise<any> => {
  if (!schema) return schema;

  const newSchema = _.cloneDeep(schema);
  const stack = [{ node: newSchema }];

  while (stack.length) {
    const { node } = stack.pop()!;

    if (node['ui:expr']) {
      const extraOptions = await evaluate(node['ui:expr'], data, {});
      _.merge(node, extraOptions);
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

export const evaluate = async (
  expr: unknown,
  context: Context,
  defaultValue: any,
  maxSteps = 256
): Promise<any> => {
  if (expr === undefined || expr === null) return defaultValue;

  try {
    const val = typeof expr === 'string' ? expr : String(expr);
    let ast = cache.get(val);

    if (!ast) {
      ast = jsep(val);
      cache.set(val, ast);
    }

    return await evalAstIterative(ast, context, maxSteps);
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

// Walk the AST to find variable names (Symbol nodes usually represent variables)
export const extractUndeclaredVariables = (
  node: any,
  declaredStack: Set<string>[] = [new Set()],
  undeclared: Set<string> = new Set()
): Set<string> => {
  if (!node) return undeclared;
  if (typeof node === 'string')
    // @ts-ignore
    return extractUndeclaredVariables(nunjucks.parser.parse(node));

  const currentScope = declaredStack[declaredStack.length - 1];

  // Detect declaration nodes and add to current scope
  if (node.typename === 'For') {
    // node.key and node.value are declared variables in the loop
    if (node.key) {
      currentScope.add(node.key.value);
    }
    if (node.value) {
      currentScope.add(node.value.value);
    }
    // The iterable expression is evaluated but does not declare variables
    // Recurse inside the loop body with new nested scope
    declaredStack.push(new Set(currentScope)); // new scope inherits current
    extractUndeclaredVariables(node.body, declaredStack, undeclared);
    declaredStack.pop();
    // Also recurse iterable expression outside scope
    extractUndeclaredVariables(node.arr, declaredStack, undeclared);
    return undeclared;
  }

  if (node.typename === 'Set') {
    // {% set var = expr %} declares 'var'
    if (node.targets && Array.isArray(node.targets)) {
      node.targets.forEach((target: any) => {
        if (target.typename === 'Symbol') {
          currentScope.add(target.value);
        }
      });
    }
    // Recurse into value expressions to extract undeclared variables
    extractUndeclaredVariables(node.value, declaredStack, undeclared);
    return undeclared;
  }

  if (node.typename === 'Macro') {
    // Macro parameters are declared variables
    declaredStack.push(new Set(currentScope));
    if (node.args && node.args.children) {
      node.args.children.forEach((arg: any) => {
        if (arg.typename === 'Symbol') {
          declaredStack[declaredStack.length - 1].add(arg.value);
        }
      });
    }
    extractUndeclaredVariables(node.body, declaredStack, undeclared);
    declaredStack.pop();
    return undeclared;
  }

  if (node.typename === 'Symbol') {
    // Check if variable is declared in any scope
    const isDeclared = declaredStack.some((scope) => scope.has(node.value));
    if (!isDeclared) {
      undeclared.add(node.value);
    }
    return undeclared;
  }

  // Generic recursion on children properties
  for (const key in node) {
    if (node[key] && typeof node[key] === 'object') {
      if (Array.isArray(node[key])) {
        node[key].forEach((child: any) =>
          extractUndeclaredVariables(child, declaredStack, undeclared)
        );
      } else {
        extractUndeclaredVariables(node[key], declaredStack, undeclared);
      }
    }
  }

  return undeclared;
};
