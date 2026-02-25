import React, { useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';

export interface ConsoleLog {
  method: string;
  data?: any[];
  args?: any[];
}

interface ConsoleProps {
  logs: ConsoleLog[];
  variant?: 'light' | 'dark';
}

const getColor = (method: string, themeMode: 'light' | 'dark') => {
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

const formatArg = (arg: any) => {
  if (typeof arg === 'string') return arg;

  if (
    typeof arg === 'number' ||
    typeof arg === 'boolean' ||
    arg === null ||
    arg === undefined
  )
    return String(arg);

  if (arg instanceof Error) return arg.stack || arg.message;

  try {
    return JSON.stringify(arg, null, 2);
  } catch {
    return String(arg);
  }
};

export const Console: React.FC<ConsoleProps> = ({ logs, variant = 'dark' }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    });
  }, [logs]);

  return (
    <Box>
      {logs.length === 0 && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ px: 1, py: 0.5 }}
        >
          No output
        </Typography>
      )}

      {logs.map((log, index) => {
        const args = log.data || log.args || [];

        return (
          <Box
            key={index}
            sx={{
              display: 'flex',
              gap: 1,
              px: 1,
              py: 0.25,
              fontFamily: 'Roboto Mono, monospace',
              fontSize: 13,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography
              sx={{
                minWidth: 55,
                fontWeight: 600,
                color: getColor(log.method, variant),
                textTransform: 'lowercase',
              }}
            >
              {log.method}
            </Typography>

            <Box
              sx={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: getColor(log.method, variant),
              }}
            >
              {args.map((arg, i) => (
                <span key={i}>
                  {formatArg(arg)}
                  {i < args.length - 1 ? ' ' : ''}
                </span>
              ))}
            </Box>
          </Box>
        );
      })}

      <div ref={bottomRef} />
    </Box>
  );
};

export default Console;
