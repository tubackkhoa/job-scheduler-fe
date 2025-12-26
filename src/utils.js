export const extractUiSchema = (schema) => {
  if (!schema || !schema.properties) return {};

  const uiSchema = {};
  const stack = [
    {
      props: schema.properties,
      target: uiSchema,
      path: [],
    },
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
          path: [...path, key],
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

/**
 * Formats ugly Python datetime repr strings like:
 * "datetime.datetime(2025, 12, 18, 10, 57, 15, 461066, tzinfo=...)"
 * → "12/18/2025, 10:57:15 AM"
 */
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
          hour12: true,
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
  NOTSET: 'primary.main',
};

export const getLevelColor = (level) =>
  LEVEL_COLOR_MAP[level.toUpperCase()] ?? LEVEL_COLOR_MAP.NOTSET;

export const evaluate = (expr, context, defaultValue) => {
  try {
    return Function(...Object.keys(context), expr)(...Object.values(context));
  } catch (error) {
    console.error('Expression evaluation error:', error);
    return defaultValue;
  }
};
