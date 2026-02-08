import { Paper, TextField, Typography, Alert, Stack, Box } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useState } from 'react';

export default function DownloadModuleForm() {
  const [name, setName] = useState('');
  const [version, setVersion] = useState(
    'git+https://github.com/user/repo@branch',
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PostResponse>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
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
        Download Module
      </Typography>
      <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
        <Stack component="form" spacing={2} onSubmit={handleSubmit}>
          <TextField
            label="Module Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
          />

          <TextField
            label="Version / Git URL"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            helperText="Example: git+https://github.com/user/repo@branch"
            required
            fullWidth
          />

          <LoadingButton
            type="submit"
            variant="contained"
            loading={loading}
            disabled={!name}
          >
            Download
          </LoadingButton>

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
