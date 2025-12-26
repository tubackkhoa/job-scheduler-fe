import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Typography,
  Box,
} from '@mui/material';
import { useState } from 'react';

export function CreatePluginModal({ open, onClose, onSubmit, isLoading }) {
  const [packageName, setPackageName] = useState('');
  const [interval, setInterval] = useState(60);
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({});

  const handleClose = () => {
    setPackageName('');
    setInterval(60);
    setDescription('');
    setErrors({});
    onClose();
  };

  const validate = () => {
    const newErrors = {};
    
    if (!packageName.trim()) {
      newErrors.packageName = 'Package name is required';
    } else if (!packageName.includes('.')) {
      newErrors.packageName = 'Package name should be a valid Python import path (e.g., plugins.sample_plugin@v0_1_0.Plugin)';
    }

    if (!interval || interval < 1) {
      newErrors.interval = 'Interval must be at least 1 second';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    onSubmit({
      package: packageName.trim(),
      interval: Number(interval),
      description: description.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" fontWeight={600}>
          Create New Plugin
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Add a new plugin to the scheduler
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <TextField
            label="Package Name"
            value={packageName}
            onChange={(e) => setPackageName(e.target.value)}
            placeholder="plugins.sample_plugin@v0_1_0.Plugin"
            error={!!errors.packageName}
            helperText={
              errors.packageName ||
              'Python import path to the plugin class (e.g., plugins.sample_plugin@v0_1_0.Plugin)'
            }
            required
            fullWidth
            disabled={isLoading}
          />

          <TextField
            label="Interval (seconds)"
            type="number"
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
            error={!!errors.interval}
            helperText={errors.interval || 'How often the plugin should run (in seconds)'}
            required
            fullWidth
            inputProps={{ min: 1 }}
            disabled={isLoading}
          />

          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description for this plugin"
            multiline
            rows={3}
            fullWidth
            disabled={isLoading}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isLoading || !packageName.trim() || !interval}
        >
          {isLoading ? 'Creating...' : 'Create Plugin'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

