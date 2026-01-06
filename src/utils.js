import jsep from 'jsep';
import _ from 'lodash';

const evalAstIterative = (root, context, maxSteps) => {
  const stack = [{ node: root, visited: false }];
  const values = new Map();
  let steps = 0;
  while (stack.length) {
    if (++steps > maxSteps) {
      throw new Error('Evaluation step limit exceeded');
    }
    const item = stack.pop();
    const node = item.node;

    if (!item.visited) {
      // Post-order: push node back as visited, then children
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
      // Evaluate node once children are processed
      let result;

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
          // return <expression>
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

export const extractUiSchema = (schema) => {
  if (!schema || !schema.properties) return {};

  const uiSchema = {};
  const stack = [
    {
      props: schema.properties,
      target: uiSchema,
      path: []
    }
  ];

  while (stack.length > 0) {
    const { props, target, path } = stack.pop();

    for (const [key, prop] of Object.entries(props)) {
      const uiEntry = {};

      // Copy ui:field and ui:classNames if present
      for (const uiKey in prop) {
        if (uiKey.startsWith('ui:')) {
          uiEntry[uiKey] = prop[uiKey];
        }
      }

      // Check for nested properties either inline or via $ref
      let nestedProps = null;

      if (prop.type === 'object' && prop.properties) {
        nestedProps = prop.properties;
      } else if (prop.$ref) {
        const defKey = prop.$ref.replace('#/$defs/', '');
        const defSchema = schema.$defs?.[defKey];
        if (defSchema?.type === 'object' && defSchema.properties) {
          nestedProps = defSchema.properties;
        }
      }

      // If nested properties exist, prepare for next iteration
      if (nestedProps) {
        // Add current uiEntry to target[key]
        target[key] = uiEntry;
        // Create the nested object to hold children UI schemas
        if (!target[key]) target[key] = {};
        // Stack push for deeper properties
        stack.push({
          props: nestedProps,
          target: target[key],
          path: [...path, key]
        });
      } else if (Object.keys(uiEntry).length > 0) {
        // Only add uiEntry if not empty and no nested props
        target[key] = uiEntry;
      }
    }
  }

  return uiSchema;
};

export const getSystemTheme = () =>
  window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';

export const formatMessage = (message) => {
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
        return match; // fallback if parsing fails
      }
    }
  );
};

const LEVEL_COLOR_MAP = {
  CRITICAL: 'error.dark',
  ERROR: 'error.main',
  WARNING: 'warning.main',
  INFO: 'info.main',
  DEBUG: 'success.main',
  NOTSET: 'primary.main'
};

export const getLevelColor = (level) =>
  LEVEL_COLOR_MAP[level.toUpperCase()] ?? LEVEL_COLOR_MAP.NOTSET;

const cache = new Map();

export const evaluate = (expr, context, defaultValue, maxSteps = 256) => {
  try {
    const val = typeof expr === "string" ? expr : expr.toString();
    let ast = cache.get(val);
    if (!ast) {
      ast = jsep(val);
      cache.set(val, ast);
    }
    return evalAstIterative(ast, context, maxSteps);
  } catch (err) {
    console.log('Evaluation error:', err.message);
    return defaultValue;
  }
};

export class JinjaCompletionBuilder {
  /* ---------- Server symbols ---------- */

  static buildGlobals(globals = []) {
    return globals.map((name) => {
      const [label, type = 'function'] = name.split(':');
      return {
        label,
        type,
        detail: 'global',
        section: 'Globals'
      };
    });
  }

  static buildFilters(filters = []) {
    return filters.map((name) => ({
      label: name,
      type: 'function',
      detail: 'filter',
      section: 'Filters'
    }));
  }

  static buildTests(tests = []) {
    return tests.map((name) => ({
      label: name,
      type: 'keyword',
      detail: 'test',
      section: 'Tests'
    }));
  }

  static buildTags(tags = []) {
    return tags.map((name) => ({
      label: name,
      type: 'keyword',
      detail: 'tag',
      section: 'Tags'
    }));
  }

  /* ---------- Params ---------- */

  static buildTopLevelVariables(params = {}) {
    return Object.keys(params).map((key) => ({
      label: key,
      type: 'variable',
      detail: 'param',
      section: 'Variables'
    }));
  }

  static buildProperties(params = {}) {
    return (path) => {
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

  /* ---------- Final public API ---------- */

  static build(params = {}, serverSymbols = {}) {
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
