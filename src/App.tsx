import { useState } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { Box, Container, CssBaseline } from "@mui/material";
import { Header } from "./components/Header";
import { LoadingBar } from "./components/LoadingBar";
import { ErrorAlert } from "./components/ErrorAlert";
import { darkTheme } from "./theme";
import { Routes, Route } from "react-router-dom";
import PluginManager from "./pages/PluginManager";
import NotificationsProvider from "./hooks/useNotifications/NotificationsProvider";
import DialogsProvider from "./hooks/useDialogs/DialogsProvider";
import Login from "./pages/Login";
import RequireAuth from "./auth/RequireAuth";
import Dashboard from "./pages/Dashboard";

export default function App() {
  // to show loading and error global
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
        <LoadingBar isLoading={loading} />

        <Container maxWidth={false} sx={{ pb: 3, px: { xs: 2, sm: 3, md: 4 } }}>
          <Header />

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
                  <Route
                    path="/plugins/:plugin_id?"
                    element={
                      <PluginManager
                        setLoading={setLoading}
                        setError={setError}
                      />
                    }
                  >
                    <Route path="sessions/:session_id" />
                    <Route path="sessions/:session_id/jobs/:job_id" />
                  </Route>
                </Route>
              </Routes>
            </DialogsProvider>
          </NotificationsProvider>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
