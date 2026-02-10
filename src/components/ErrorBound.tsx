import React, { ReactNode, ErrorInfo } from 'react';
import { Alert } from '@mui/material';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  resetKey?: string | number;
}

interface ErrorBoundaryState {
  error?: string;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('Lazy component error:', error, info);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // Reset error state when the lazy source changes
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    const { error } = this.state;

    if (error) {
      return (
        this.props.fallback ?? (
          <Alert variant="outlined" severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )
      );
    }

    return this.props.children;
  }
}
