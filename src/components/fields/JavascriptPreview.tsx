import { Console } from '@/components/Console';
import React, { useEffect, useRef, useState } from 'react';
import { Paper } from '@mui/material';
import { useAppColorScheme } from '@/hooks/useAppColorSchema';

interface Props {
  text: string;
  fullscreen: boolean;
  providers: string[];
}

/**
 * Safely runs code inside iframe
 */
const runCode = (
  iframe: HTMLIFrameElement,
  code: string,
  providers: string[],
  hideConsole = true,
) => {
  iframe.srcdoc = `
<script>
    ${providers
      .map((provider) => {
        return `window.${provider} = parent.${provider};`;
      })
      .join('\n')}
    
    const METHODS = ['log', 'info', 'warn', 'error', 'debug'];

    METHODS.forEach(function (method) {
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
        parent.postMessage(
        {
            type: 'console',
            method: 'error',
            args: [message, error && error.stack]
        }, '*');
    };

    window.onunhandledrejection = function (event) {
        parent.postMessage(
        {
            type: 'console',
            method: 'error',
            args: [event.reason]
        }, '*');
    };
</script>

<script type="module">
    try {
    ${code}
    } catch (e) {
    console.error(e);
    }
</script>
`;
};

export const JavascriptPreview: React.FC<Props> = ({
  text,
  fullscreen,
  providers,
}) => {
  const [mode] = useAppColorScheme();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    setLogs([]);

    const onMessage = (event: MessageEvent<any>) => {
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
      runCode(iframeRef.current, text, providers);
    }

    return () => window.removeEventListener('message', onMessage);
  }, [text]);

  return (
    <Paper
      elevation={2}
      sx={{
        maxHeight: fullscreen ? '100%' : 600,
        minHeight: 300,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <iframe ref={iframeRef} style={{ display: 'none' }} />
      <Console logs={logs} variant={mode} />
    </Paper>
  );
};
