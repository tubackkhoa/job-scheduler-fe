import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Box,
  Stack,
  TextField,
  Typography,
  CircularProgress,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  ListItemText,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
} from '@mui/material';

import CodeMirror from '@uiw/react-codemirror';

import { jinjaEvaluate, jinjaLang } from '@/utils';
import api from '@/api';
import { MarkdownPreview } from '@/components/fields/MarkdownPreview';
import useNotifications from '@/hooks/useNotifications/useNotifications';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  model?: string;
};

export default function TemplateStudio() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const notifications = useNotifications();

  const [plugins, setPlugins] = useState<PluginData[]>([]);
  const [packageName, setPackageName] = useState('');

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  const [output, setOutput] = useState('');
  const [preview, setPreview] = useState('');

  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'editor' | 'preview'>('editor');

  useEffect(() => {
    api.fetchPlugins().then(setPlugins);
  }, []);

  async function sendMessage(opts: { content: string; index?: number }) {
    const content = opts.content.trim();

    if (loading || !packageName || !content) return;

    let baseMessages = messages;

    if (opts.index !== undefined) {
      baseMessages = messages.slice(0, opts.index + 1);
    } else {
      const userMsg: Message = { role: 'user', content };
      baseMessages = [...messages, userMsg];
      setInput('');
    }

    setMessages([...baseMessages, { role: 'assistant', content: '' }]);

    setLoading(true);

    let text = '';
    let model = '';

    try {
      await api.streamChat({
        payload: {
          package: packageName,
          message: content,
          history: baseMessages.slice(-6).map((m) => m.content),
        },

        onMeta(meta) {
          model = meta.model;
        },

        onToken(token: string) {
          text += token;

          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = {
              role: 'assistant',
              content: text,
              model,
            };
            return copy;
          });

          setOutput(text);
        },
      });
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage({ content: input });
    }
  }

  const handleTabChange = async (
    _: React.SyntheticEvent,
    value: 'editor' | 'preview',
  ) => {
    setTab(value);
  };

  const loadPreview = async (text: string) => {
    // Only render preview when user switches to preview tab, not on every keystroke
    if (loading) return;

    let tmpl = text.trim();
    if (!tmpl) return;

    try {
      tmpl = tmpl.replace(/^```[a-zA-Z0-9]*\s*\n?/, '').replace(/\n?```$/, '');

      const result = await jinjaEvaluate(packageName, tmpl, {}, true);
      const normalized = result.replace(/^\s+(<\/?[a-zA-Z][^>]*>)/gm, '$1');
      setPreview(normalized);
    } catch (ex) {
      notifications.show(ex.message, { severity: 'error' });
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* HEADER */}
      <Stack gap={2} mb={2}>
        <Typography variant="h5" fontWeight={700}>
          🧩 Template Studio
        </Typography>

        <FormControl size="small" sx={{ minWidth: 300 }}>
          <InputLabel>Plugin</InputLabel>

          <Select
            value={packageName}
            label="Plugin"
            onChange={(e) => setPackageName(e.target.value)}
          >
            {plugins.map((p) => (
              <MenuItem key={p.id} value={p.package}>
                <ListItemText
                  primary={p.package}
                  secondary={p.description}
                  slotProps={{
                    primary: { noWrap: true },
                    secondary: { noWrap: true },
                  }}
                />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Paper
        sx={{
          display: 'flex',
          flexDirection: { md: 'row', xs: 'column' },
          minHeight: { md: '75vh' },
          maxHeight: { md: '90vh' },
        }}
      >
        {/* CHAT */}
        <Stack flex={1} justifyContent="space-between" minWidth={0}>
          <Box
            sx={{
              p: 2,
              overflowY: 'auto',
            }}
          >
            <Stack spacing={2}>
              {messages.map((msg, i) => (
                <Box
                  key={i}
                  sx={{
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '90%',
                  }}
                >
                  {msg.role === 'user' ? (
                    <Stack direction="row" spacing={1}>
                      <Paper
                        sx={{
                          p: 1.5,
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                        }}
                      >
                        <Typography whiteSpace="pre-wrap">
                          {msg.content}
                        </Typography>
                      </Paper>

                      <Tooltip title="Resend">
                        <IconButton
                          size="small"
                          onClick={() =>
                            sendMessage({
                              content: msg.content,
                              index: i,
                            })
                          }
                        >
                          <AppIcon.Refresh fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  ) : (
                    <Paper
                      variant="outlined"
                      onClick={() => {
                        setOutput(msg.content);
                        if (tab === 'preview') loadPreview(msg.content);
                      }}
                      sx={{
                        p: 1,
                        cursor: 'pointer',
                        transition: '0.15s',
                        '&:hover': {
                          bgcolor: 'action.hover',
                          borderColor: 'primary.main',
                        },
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {msg.model ?? 'Assistant'} • Click to load into editor
                      </Typography>

                      <Typography
                        whiteSpace="pre-wrap"
                        fontFamily="monospace"
                        sx={{
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 6,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {msg.content}
                      </Typography>
                    </Paper>
                  )}
                </Box>
              ))}

              {loading && <CircularProgress size={20} />}
            </Stack>
          </Box>

          <Box sx={{ borderTop: '1px solid', borderColor: 'divider', p: 2 }}>
            <Stack direction="row" spacing={1}>
              <TextField
                fullWidth
                multiline
                maxRows={4}
                placeholder="Describe template..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />

              <Button
                variant="contained"
                disabled={loading || !packageName}
                onClick={() => sendMessage({ content: input })}
              >
                Send
              </Button>
            </Stack>
          </Box>
        </Stack>

        {/* EDITOR + PREVIEW */}
        <Box
          sx={{
            overflowX: 'hidden',
            p: 2,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            flex: 2,
            minWidth: 0,
          }}
        >
          <Tabs
            orientation={isMobile ? 'horizontal' : 'vertical'}
            value={tab}
            onChange={handleTabChange}
          >
            <Tab label="Editor" value="editor" />
            <Tab
              label="Preview"
              value="preview"
              onClick={() => loadPreview(output)}
            />
          </Tabs>
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              overflow: 'auto',
            }}
          >
            {/* EDITOR */}
            <Box
              sx={{
                display: tab === 'editor' ? 'block' : 'none',
                height: '100%',
              }}
            >
              <CodeMirror
                value={output}
                onChange={setOutput}
                theme={theme.palette.mode}
                extensions={[jinjaLang]}
              />
            </Box>

            {/* PREVIEW */}
            <Box
              sx={{
                display: tab === 'preview' ? 'block' : 'none',
                height: '100%',
              }}
            >
              <MarkdownPreview text={preview} />
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
