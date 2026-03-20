import init, { Environment } from 'minijinja-js';
// @ts-ignore
typeof init === 'function' && (await init());

// --- environment setup ---
const env = new Environment();
env.undefinedBehavior = 'strict';

// add some filter method, this help rendering at client if possible before fallback to server
env.addFilter('in_clause', (values: any[]): string => {
  if (!values || values.length === 0) return '()';
  return `(${values.map((v) => JSON.stringify(v)).join(',')})`;
});
env.addFilter('tojson', JSON.stringify);

// --- render function ---
export function render(
  tplStr: string,
  context: AnyObject = {},
  ctx: AnyObject = {},
): string | string[] {
  try {
    return env.renderStr(tplStr, {
      ...context,
      this: context,
      ctx: ctx,
    });
  } catch (err) {
    const missing = env.findVars(tplStr);
    if (missing.length > 0) {
      return missing;
    }
    throw err; // rethrow real errors
  }
}
