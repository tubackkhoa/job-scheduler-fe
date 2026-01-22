import { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { Box, Container, CssBaseline } from '@mui/material';
import { Header } from './components/dashboard/Header';
import { LoadingBar } from './components/dashboard/LoadingBar';
import { ErrorAlert } from './components/dashboard/ErrorAlert';
import { darkTheme } from './theme';
import { Routes, Route } from 'react-router-dom';
import PluginManager from './pages/PluginManager';
import SignalCalendar from './pages/Settings';
import NotificationsProvider from './hooks/useNotifications/NotificationsProvider';
import DialogsProvider from './hooks/useDialogs/DialogsProvider';

export default function App() {
  // to show loading and error global
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <LoadingBar isLoading={loading} />

        <Container maxWidth={false} sx={{ py: 3, px: { xs: 2, sm: 3, md: 4 } }}>
          <Header />

          {error && (
            <Box sx={{ mt: 3 }}>
              <ErrorAlert message={error} onClose={() => setError(null)} />
            </Box>
          )}
          <NotificationsProvider>
            <DialogsProvider>
              <Routes>
                <Route
                  path="/plugins/:plugin_id"
                  element={
                    <PluginManager
                      setLoading={setLoading}
                      setError={setError}
                    />
                  }
                />
                <Route path="/settings" Component={SignalCalendar} />
              </Routes>
            </DialogsProvider>
          </NotificationsProvider>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
