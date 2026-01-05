import { Alert } from '@mui/material';
import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('JSON Schema Form error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <Alert variant="outlined" severity="error" sx={{ mb: 4 }}>
            {this.state.error.toString()}
          </Alert>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
