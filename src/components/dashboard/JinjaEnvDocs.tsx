import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useMemo, useState, useDeferredValue } from 'react';

/**
 * Types
 */
type DocItem = {
  type: string;
  doc?: string | null;
  signature?: string | null;
};

type JinjaEnvJson = {
  globals: Record<string, DocItem>;
  filters: Record<string, DocItem>;
};

type Props = {
  data: JinjaEnvJson;
};

/**
 * Reusable section renderer
 */
function DocSection({
  title,
  items
}: {
  title: string;
  items: Record<string, DocItem>;
}) {
  if (Object.keys(items).length === 0) {
    return (
      <Box mb={4}>
        <Typography
          variant="h6"
          fontWeight={600}
          sx={{ mb: 1.5, letterSpacing: 0.3 }}
        >
          {title}
        </Typography>

        <Typography variant="body2" color="text.secondary" fontStyle="italic">
          No matching results.
        </Typography>
      </Box>
    );
  }

  return (
    <Box mb={5}>
      <Typography
        variant="h6"
        fontWeight={600}
        sx={{ mb: 1.5, letterSpacing: 0.3 }}
      >
        {title}
      </Typography>

      <Divider sx={{ mb: 2 }} />

      {Object.entries(items).map(([name, item]) => (
        <Accordion
          key={name}
          disableGutters
          square
          sx={(theme) => ({
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            '&:not(:last-of-type)': {
              borderBottom: 'none'
            },
            '&:before': { display: 'none' },

            // hover & expanded states
            '& .MuiAccordionSummary-root': {
              minHeight: 44,
              transition: 'background-color 120ms ease',
              '&:hover': {
                backgroundColor: theme.palette.action.hover
              }
            },
            '&.Mui-expanded': {
              backgroundColor: theme.palette.background.default
            }
          })}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
              <Typography fontWeight={500} sx={{ fontFamily: 'monospace' }}>
                {name}
              </Typography>

              <Chip
                size="small"
                label={item.type}
                sx={(theme) => ({
                  height: 20,
                  fontSize: 11,
                  borderRadius: 1,
                  borderColor: theme.palette.divider,
                  color: theme.palette.text.secondary
                })}
                variant="outlined"
              />

              {item.signature && (
                <Chip
                  size="small"
                  label="sig"
                  sx={(theme) => ({
                    height: 20,
                    fontSize: 11,
                    borderRadius: 1,
                    borderColor: theme.palette.divider,
                    color: theme.palette.text.secondary
                  })}
                  variant="outlined"
                />
              )}
            </Box>
          </AccordionSummary>

          <AccordionDetails sx={{ pt: 0 }}>
            {item.signature && (
              <Box mb={1.5}>
                <Typography
                  component="pre"
                  sx={(theme) => ({
                    margin: 0,
                    padding: '8px 10px',
                    fontSize: 12,
                    lineHeight: 1.6,
                    fontFamily:
                      'ui-monospace, SFMono-Regular, Menlo, monospace',
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 1,
                    color: theme.palette.text.secondary,
                    overflowX: 'auto'
                  })}
                >
                  {item.signature}
                </Typography>
              </Box>
            )}

            {item.doc ? (
              <Typography
                component="pre"
                sx={(theme) => ({
                  margin: 0,
                  padding: '10px 12px',
                  fontSize: 13,
                  lineHeight: 1.7,
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  backgroundColor: theme.palette.background.default,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                  color: theme.palette.text.primary
                })}
              >
                {item.doc}
              </Typography>
            ) : (
              <Typography
                variant="body2"
                color="text.secondary"
                fontStyle="italic"
              >
                No documentation available.
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}

/**
 * Main component
 */
export default function JinjaEnvDocs({ data }: Props) {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const filteredGlobals = useMemo(() => {
    if (!normalizedQuery) return data.globals;
    return Object.fromEntries(
      Object.entries(data.globals).filter(([name]) =>
        name.toLowerCase().includes(normalizedQuery)
      )
    );
  }, [data.globals, normalizedQuery]);

  const filteredFilters = useMemo(() => {
    if (!normalizedQuery) return data.filters;
    return Object.fromEntries(
      Object.entries(data.filters).filter(([name]) =>
        name.toLowerCase().includes(normalizedQuery)
      )
    );
  }, [data.filters, normalizedQuery]);

  return (
    <Box
      p={3}
      sx={(theme) => ({
        backgroundColor: theme.palette.background.default
      })}
    >
      <Typography
        variant="h5"
        fontWeight={700}
        gutterBottom
        sx={{ letterSpacing: 0.4 }}
      >
        Environment
      </Typography>

      {/* 🔍 Search */}
      <TextField
        fullWidth
        size="small"
        placeholder="Search globals and filters…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        sx={(theme) => ({
          mb: 3,
          '& .MuiOutlinedInput-root': {
            fontFamily: 'monospace',
            backgroundColor: theme.palette.background.paper
          }
        })}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          )
        }}
      />

      <DocSection title="Globals" items={filteredGlobals} />
      <DocSection title="Filters" items={filteredFilters} />
    </Box>
  );
}
