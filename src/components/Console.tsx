import React, { useMemo } from 'react';
import { Box, PaletteMode, Typography } from '@mui/material';
import CodeMirror from '@uiw/react-codemirror';
import { jsonLang } from '@/utils';

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
  // precompute all formatted logs safely
  const formattedLogs = useMemo(
    () =>
      logs.map((log) => {
        const args = log.data || log.args || [];
        return {
          ...log,
          formatted: args.map(stringifySafe).join('\n'),
          isObjectLike: args.some((a) => typeof a === 'object' && a !== null),
        };
      }),
    [logs],
  );

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
    <>
      {formattedLogs.map((log, index) => (
        <Box
          key={index}
          sx={{
            px: 2,
            py: 1,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          {log.isObjectLike ? (
            <CodeMirror
              value={log.formatted}
              editable={false}
              height="auto"
              theme={variant}
              className="cm-transparent"
              extensions={[jsonLang]}
              basicSetup={{
                lineNumbers: false,
                foldGutter: true,
              }}
              style={{
                fontSize: 13,
              }}
            />
          ) : (
            <Typography
              noWrap
              fontSize={13}
              color={getColor(log.method, variant)}
            >
              {log.formatted}
            </Typography>
          )}
        </Box>
      ))}
    </>
  );
};
