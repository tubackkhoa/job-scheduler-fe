import {
  Paper,
  Button,
  TextField,
  Typography,
  Alert,
  Stack,
  Box,
} from '@mui/material';

import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function DownloadModuleForm() {
  const [name, setName] = useState('');
  const [version, setVersion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PostResponse>(null);
  const [error, setError] = useState('');
  const { t } = useTranslation();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await api.downloadModule(name, version);
      setResult(res);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to download module');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ my: 3, mx: 1, position: { md: 'sticky' }, top: 140 }}>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        {t('download module')}
      </Typography>
      <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
        <Stack component="form" spacing={2} onSubmit={handleSubmit}>
          <TextField
            label={t('module name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
          />

          <TextField
            label={t('version / git url')}
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            helperText="Example: git+https://github.com/user/repo@branch"
            required
            fullWidth
          />

          <Button
            type="submit"
            variant="contained"
            loading={loading}
            disabled={!name}
          >
            {t('download')}
          </Button>

          {result && (
            <Alert severity={result.success ? 'success' : 'warning'}>
              {result.success ? 'Download successful' : 'Download failed'}
            </Alert>
          )}

          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </Paper>
    </Box>
  );
}
