import { useState } from 'react';
import {
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Grid,
  Chip
} from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import EditIcon from '@mui/icons-material/Edit';
import { LanguageDescription } from '@codemirror/language';
import ReactCodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import api from '@/api';
import { jinjaLang, yamlLangWithJs } from '@/utils';

const GENERATE_SAMPLES = [
  {
    id: 'hello_plugin_basic',
    title: 'Hello Plugin (Webhook)',
    description: 'Generate a webhook-based plugin with env and roles',
    prompt: [
      'Generate a plugin named hello_plugin version 1.',
      'The plugin should define a configuration schema with:',
      '- webhook_url (string)',
      '- webhook_api_key (string, password widget)',
      '- env (enum: staging, production, uat)',
      '- model_type (dynamic UI field with model bindings)',
      'Include roles for user and admin.',
      'Render runtime output as JSON with all config fields included.'
    ].join('\n')
  }
];

const EDIT_SAMPLES = [
  {
    id: 'add_timeout',
    title: 'Add timeout',
    instruction: 'Add a timeout field with default 30 seconds'
  },
  {
    id: 'make_timeout_optional',
    title: 'Make timeout optional',
    instruction: 'Make timeout optional and default to 10'
  },
  {
    id: 'add_retry',
    title: 'Add retry count',
    instruction: 'Add retry_count with default 3'
  }
];

type Sample = {
  id: string;
  title: string;
  prompt?: string;
  instruction?: string;
};

type Props = {
  title: string;
  samples: Sample[];
  onSelect: (text: string) => void;
};

function PromptSamples({ title, samples, onSelect }: Props) {
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography fontWeight={600} gutterBottom>
        {title}
      </Typography>

      <Stack
        direction="row"
        flexWrap="wrap"
        sx={{
          gap: 1
        }}
      >
        {samples.map((s) => (
          <Chip
            key={s.id}
            label={s.title}
            onClick={() => onSelect(s.prompt ?? s.instruction ?? '')}
            clickable
            color="primary"
            variant="outlined"
            sx={{
              width: { xs: '100%', sm: 'auto' }
            }}
          />
        ))}
      </Stack>
    </Paper>
  );
}

export default function ChatBot() {
  const [mode, setMode] = useState<'generate' | 'edit'>('generate');
  const [query, setQuery] = useState('');
  const [plugin, setPlugin] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setOutput('');
    setLoading(true);

    try {
      if (mode === 'generate') {
        const result = await api.streamChat({
          payload: { query },
          onToken: setOutput
        });

        setPlugin(result);
      } else {
        const result = await api.streamChat({
          followUp: true,
          payload: {
            plugin,
            instruction: query
          },
          onToken: setOutput
        });

        setPlugin(result);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container
      maxWidth={false}
      sx={{
        py: { xs: 0, sm: 4 },
        px: { xs: 0, sm: 2 }
      }}
    >
      <Typography variant="h5" fontWeight={700} gutterBottom>
        🧩 Plugin Generator
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Tabs
          value={mode}
          onChange={(_, v) => setMode(v)}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab
            value="generate"
            label="Generate"
            icon={<AutoFixHighIcon />}
            iconPosition="start"
          />
          <Tab
            value="edit"
            label="Edit"
            icon={<EditIcon />}
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      <Grid container spacing={2}>
        {/* Left: Input */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2, flex: 1 }}>
            <Typography fontWeight={600} gutterBottom>
              {mode === 'generate' ? 'Prompt' : 'Edit Instruction'}
            </Typography>

            {mode === 'generate' && (
              <PromptSamples
                title="Generate Examples"
                samples={GENERATE_SAMPLES}
                onSelect={(text) => setQuery(text)}
              />
            )}

            {mode === 'edit' && (
              <PromptSamples
                title="Edit Examples"
                samples={EDIT_SAMPLES}
                onSelect={(text) => setQuery(text)}
              />
            )}

            <TextField
              multiline
              minRows={6}
              fullWidth
              placeholder={
                mode === 'generate'
                  ? 'Describe the plugin you want…'
                  : 'What should be changed?'
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            <Button
              variant="contained"
              size="large"
              sx={{ mt: 2 }}
              onClick={handleSubmit}
              disabled={loading || !query.trim()}
              fullWidth
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : mode === 'generate' ? (
                'Generate Plugin'
              ) : (
                'Apply Edit'
              )}
            </Button>
          </Paper>
        </Grid>
        {/* Right: Output */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper
            sx={{
              p: 2,
              flex: 1,
              width: '100%',
              bgcolor: '#0f172a',
              color: '#e5e7eb',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              overflow: 'auto'
            }}
          >
            <Typography fontWeight={600} gutterBottom color="inherit">
              Output
            </Typography>

            {output ? (
              <ReactCodeMirror
                theme="dark"
                minHeight="200px"
                maxHeight="100vh"
                width="100%"
                value={output}
                extensions={[
                  markdown({
                    codeLanguages: [
                      LanguageDescription.of({
                        name: 'yaml',
                        support: yamlLangWithJs
                      }),
                      LanguageDescription.of({
                        name: 'jinja2',
                        support: jinjaLang
                      })
                    ]
                  })
                ]}
              />
            ) : (
              <Typography color="gray" sx={{ minHeight: 300 }}>
                Streaming output will appear here…
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
