import { useState, useRef, useEffect } from 'react';
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
} from '@mui/material';
import ReactCodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { jinjaLang } from '@/utils';
import api from '@/api';
import { useAppColorScheme } from '@/hooks/useAppColorSchema';
import { MarkdownPreview } from '@/components/fields/MarkdownPreview';

type Message = { role: 'user' | 'assistant'; content: string; model?: string };

export default function TemplateStudio() {
  const [mode] = useAppColorScheme();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const [plugins, setPlugins] = useState<PluginData[]>([]);
  const [packageName, setPackageName] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState('');

  useEffect(() => {
    api.fetchPlugins().then(setPlugins);
  }, []);

  const setEditor = (text: string) => {
    editorRef.current?.view?.dispatch({
      changes: {
        from: 0,
        to: editorRef.current.view.state.doc.length,
        insert: text,
      },
    });
  };

  const getEditor = () => {
    return editorRef.current?.view.state.doc.toString();
  };

  async function sendMessage(opts?: {
    content?: string;
    index?: number; // resend from this user message index
  }) {
    if (loading || !packageName || !inputRef.current) return;

    const content = opts?.content ?? inputRef.current.value ?? '';

    if (!content.trim()) return;

    let baseMessages = messages;

    // resend mode → truncate after selected user message
    if (opts?.index !== undefined) {
      baseMessages = messages.slice(0, opts.index + 1);
    } else {
      // normal send → append user message
      const userMsg: Message = { role: 'user', content };
      baseMessages = [...messages, userMsg];
      inputRef.current.value = '';
    }

    // add empty assistant placeholder
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

          setEditor(text);
        },
      });
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const handleRun = async () => {
    let tmpl = getEditor().trim();
    if (!tmpl) return;
    tmpl = tmpl.replace(/^```[a-zA-Z0-9]*\s*\n?/, '').replace(/\n?```$/, '');
    const result = await api.renderTemplate(packageName, tmpl, {});
    setPreview(result);
  };

  function handleCopy() {
    navigator.clipboard.writeText(getEditor());
  }
  function handleClear() {
    setEditor('');
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Stack direction={{ md: 'row', sm: 'column' }} gap={2} mb={2}>
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
                    primary: {
                      noWrap: true,
                    },
                    secondary: {
                      noWrap: true,
                    },
                  }}
                />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Stack
        direction={{ md: 'row', sm: 'column' }}
        gap={2}
        mb={2}
        sx={{ minHeight: { md: '75vh' }, alignItems: 'stretch' }}
      >
        {/* CHAT */}
        <Paper
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: { md: 320 },
          }}
        >
          <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
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
                    <Stack direction="row" spacing={1} alignItems="flex-start">
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
                          sx={{ color: 'inherit' }}
                        >
                          <AppIcon.Refresh fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  ) : (
                    <Paper
                      variant="outlined"
                      onClick={() => setEditor(msg.content)}
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
              <div ref={bottomRef} />
            </Stack>
          </Box>

          <Box sx={{ borderTop: '1px solid', borderColor: 'divider', p: 2 }}>
            <Stack direction="row" spacing={1}>
              <TextField
                fullWidth
                multiline
                maxRows={4}
                placeholder="Describe template..."
                inputRef={inputRef}
                onKeyDown={handleKeyDown}
              />
              <Button
                variant="contained"
                disabled={loading || !packageName}
                onClick={() => sendMessage()}
              >
                Send
              </Button>
            </Stack>
          </Box>
        </Paper>

        {/* EDITOR */}
        <Paper
          sx={{
            flex: 2,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 1,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="subtitle1">Template Editor</Typography>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Run">
                <span>
                  <IconButton
                    size="small"
                    onClick={handleRun}
                    disabled={!getEditor()}
                  >
                    <AppIcon.PlayArrow fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Copy">
                <IconButton size="small" onClick={handleCopy}>
                  <AppIcon.ContentCopy fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Clear">
                <IconButton size="small" onClick={handleClear}>
                  <AppIcon.Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>

          {/* editor */}
          <ReactCodeMirror
            ref={editorRef}
            theme={mode}
            extensions={[jinjaLang]}
          />
        </Paper>
      </Stack>

      {/* preview */}
      <Box sx={{ borderTop: 1, borderColor: 'divider', p: 1 }}>
        <Typography variant="h6">Preview</Typography>
      </Box>
      {preview && (
        <Box sx={{ p: 2, maxHeight: '100%', overflow: 'auto' }}>
          <MarkdownPreview text={preview} />
        </Box>
      )}
    </Container>
  );
}
