import { useEffect, useState } from 'react';
import { getModule } from '@/utils';
import { Alert } from '@mui/material';
import { MarkdownFieldProps } from '@/global';

interface Props {
  url?: string;
  code?: string;
  source: string;
}

export const MarkdownModule = ({ url, code, source }: Props) => {
  const [Mod, setMod] =
    useState<React.ComponentType<MarkdownFieldProps> | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    if (!url && !code) {
      setMod(null);
      return;
    }

    getModule({ url, code })
      .then((mod) => {
        if (mounted) {
          setMod(() => mod.default);
        }
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Invalid module block');
      });

    return () => {
      mounted = false;
    };
  }, [url, code]);

  if (error) return <Alert severity="error">{error}</Alert>;

  if (!Mod) return null;

  return <Mod source={source} {...window.globalProps} />;
};
