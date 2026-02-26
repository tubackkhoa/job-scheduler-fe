import React, { useEffect, useMemo, useRef } from 'react';
import { Box, PaletteMode, Typography } from '@mui/material';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';

export interface ConsoleLog {
  method: string;
  data?: any[];
  args?: any[];
}

interface ConsoleProps {
  logs: ConsoleLog[];
  variant?: PaletteMode;
}

const getColor = (method: string, themeMode: PaletteMode) => {
  switch (method) {
    case 'error':
      return '#ff6b6b';
    case 'warn':
      return '#f7b731';
    case 'info':
      return '#4dabf7';
    case 'debug':
      return '#a78bfa';
    default:
      return themeMode === 'dark' ? '#e5e7eb' : '#111827';
  }
};

const stringifySafe = (arg: any) => {
  if (typeof arg === 'string') return arg;

  if (
    typeof arg === 'number' ||
    typeof arg === 'boolean' ||
    arg === null ||
    arg === undefined
  ) {
    return String(arg);
  }

  if (arg instanceof Error) {
    return arg.stack || arg.message;
  }

  try {
    return JSON.stringify(arg, null, 2);
  } catch {
    return String(arg);
  }
};

export const Console: React.FC<ConsoleProps> = ({ logs, variant }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    });
  }, [logs]);

  if (logs.length === 0) {
    return (
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ px: 1, py: 0.5 }}
      >
        No output
      </Typography>
    );
  }

  return (
    <Box>
      {logs.map((log, index) => {
        const args = log.data || log.args || [];

        const formatted = useMemo(
          () => args.map(stringifySafe).join('\n'),
          [args],
        );

        const isObjectLike = args.some(
          (a) => typeof a === 'object' && a !== null,
        );

        return (
          <Box
            key={index}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              px: 1,
              py: 0.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            {isObjectLike ? (
              <CodeMirror
                value={formatted}
                editable={false}
                height="auto"
                theme={variant}
                extensions={[json()]}
                basicSetup={{
                  lineNumbers: false,
                  foldGutter: true,
                }}
                style={{
                  fontSize: 13,
                  borderRadius: 4,
                }}
              />
            ) : (
              <Typography
                sx={{
                  fontFamily: 'Roboto Mono, monospace',
                  fontSize: 13,
                  whiteSpace: 'pre-wrap',
                  color: getColor(log.method, variant),
                }}
              >
                {formatted}
              </Typography>
            )}
          </Box>
        );
      })}

      <div ref={bottomRef} />
    </Box>
  );
};

export default Console;
