import { Console } from '@/components/Console';
import React, { useEffect, useRef, useState } from 'react';
import { Paper } from '@mui/material';
import { useAppColorScheme } from '@/hooks/useAppColorSchema';
import { BASE_PROVIDERS } from '@/constants';
import { transpile } from '@/utils';

interface Props {
  text: string;
  fullscreen: boolean;
}

interface Log {
  type: 'console';
  method: keyof Console;
  args: any[];
}

/**
 * Safely runs code inside iframe
 */
const runCode = async (
  iframe: HTMLIFrameElement,
  code: string,
  hideConsole = true,
) => {
  const jsCode = await transpile(code);
  iframe.srcdoc = `
<script>
    ${BASE_PROVIDERS.map((provider) => {
      return `window.${provider} = parent.${provider};`;
    }).join('\n')}      

    ['log', 'info', 'warn', 'error', 'debug'].forEach(function (method) {
        const original = console[method];
        console[method] = function () {
            parent.postMessage({
                type: 'console',
                method: method,
                args: Array.from(arguments)
            }, '*');
            ${hideConsole ? '' : 'original.apply(console, arguments);'}
        };
    });

    window.onerror = function (message, source, line, column, error) {
        parent.postMessage({
            type: 'console',
            method: 'error',
            args: [message, error && error.stack]
        }, '*');
    };

    window.onunhandledrejection = function (event) {
        parent.postMessage({
            type: 'console',
            method: 'error',
            args: [event.reason]
        }, '*');
    };
</script>

<script type="module">
    ${jsCode}
</script>
`;
};

export const JavascriptPreview: React.FC<Props> = ({ text, fullscreen }) => {
  const [mode] = useAppColorScheme();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    setLogs([]);

    const onMessage = (event: MessageEvent<Log>) => {
      if (event.data?.type !== 'console') return;

      setLogs((prev) => [
        ...prev,
        {
          method: event.data.method,
          data: event.data.args,
        },
      ]);
    };

    window.addEventListener('message', onMessage);

    if (iframeRef.current) {
      runCode(iframeRef.current, text).catch((ex) => {
        onMessage(
          new MessageEvent('message', {
            data: {
              type: 'console',
              method: 'error',
              args: [ex?.message || String(ex)],
            },
          }),
        );
      });
    }
    return () => window.removeEventListener('message', onMessage);
  }, [text]);

  return (
    <Paper
      sx={{
        maxHeight: fullscreen ? '100%' : 600,
        minHeight: 300,
        display: 'flex',
        overflow: 'auto',
        flexDirection: 'column',
      }}
    >
      <iframe ref={iframeRef} style={{ display: 'none' }} />
      <Console logs={logs} variant={mode} />
    </Paper>
  );
};
