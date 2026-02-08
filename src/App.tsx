import { useState } from 'react';
import { Box, Container, CssBaseline, ThemeProvider } from '@mui/material';
import './polyfill';
import { Header } from './components/Header';
import { LoadingBar } from './components/Loading';
import { ErrorAlert } from './components/ErrorAlert';
import { theme } from './theme';
import { Routes, Route } from 'react-router-dom';
import PluginManager from './pages/PluginManager';
import NotificationsProvider from './hooks/useNotifications/NotificationsProvider';
import DialogsProvider from './hooks/useDialogs/DialogsProvider';
import Login from './pages/Login';
import RequireAuth from './auth/RequireAuth';
import Dashboard from './pages/Dashboard';
import ChatBot from './pages/ChatBot';
import PageNotFound from './pages/PageNotFound';
import CustomPluginPage from './pages/CustomPluginPage';

export default function App() {
  // to show loading and error global
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const pluginElement = (
    <PluginManager setLoading={setLoading} setError={setError} />
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <LoadingBar isLoading={loading} />

        <Container
          maxWidth={false}
          sx={{ pt: '140px', pb: 3, px: { xs: 2, sm: 3, md: 4 } }}
        >
          <Header height={120} />

          {error && (
            <Box sx={{ my: 3 }}>
              <ErrorAlert message={error} onClose={() => setError(null)} />
            </Box>
          )}
          <NotificationsProvider>
            <DialogsProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route element={<RequireAuth />}>
                  <Route
                    index
                    element={
                      <Dashboard setLoading={setLoading} setError={setError} />
                    }
                  />

                  <Route path="plugins/:plugin_id?" element={pluginElement} />
                  <Route
                    path="plugins/:plugin_id/sessions/:session_id"
                    element={pluginElement}
                  />
                  <Route
                    path="plugins/:plugin_id/sessions/:session_id/jobs/:job_id"
                    element={pluginElement}
                  />
                  <Route
                    path="plugins/:plugin_id/*"
                    element={
                      <CustomPluginPage
                        setError={setError}
                        setLoading={setLoading}
                      />
                    }
                  />
                  {import.meta.env.VITE_CHATBOT_ENABLED && (
                    <Route path="chatbot" element={<ChatBot />} />
                  )}
                  <Route path="*" element={<PageNotFound />} />
                </Route>
              </Routes>
            </DialogsProvider>
          </NotificationsProvider>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
