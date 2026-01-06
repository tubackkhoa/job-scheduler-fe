import React, { useState, useCallback, memo } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider,
  TextField,
  InputAdornment,
  Button
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import { useMemo, useDeferredValue } from 'react';
import api from '../../api';

/**
 * Types
 */
type DocItem = {
  type: 'function' | 'variable';
  doc?: string | null;
  signature?: string | null;
};

type JinjaEnvJson = {
  globals: Record<string, DocItem>;
  filters: Record<string, DocItem>;
};

type Props = {
  data: JinjaEnvJson;
  pluginPackage: string;
};

type RenderResult = {
  loading: boolean;
  output?: { result: string };
  error?: string;
};

/**
 * TryInput component with local state
 */
const TryInput = memo(function TryInput({
  name,
  signature,
  onTry,
  isFilter
}: {
  name: string;
  signature?: string | null;
  onTry: (name: string, inputStr: string) => void;
  isFilter?: boolean;
}) {
  const [input, setInput] = useState('');

  const placeholder =
    signature?.replace(/^[^(]*\(([^)]*)\).*$/, '$1').trim() || 'args';

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInput(e.target.value);
    },
    []
  );

  const handleClick = useCallback(() => {
    onTry(name, input);
  }, [name, input, onTry]);

  return (
    <Box mt={2} display="flex" alignItems="center" gap={1} flexWrap="nowrap">
      {isFilter ? (
        <>
          <TextField
            size="small"
            placeholder={placeholder}
            value={input}
            onChange={handleInputChange}
            sx={{ flexGrow: 1 }}
          />
          <Typography sx={{ fontFamily: 'monospace' }}>|</Typography>
          <Typography sx={{ fontFamily: 'monospace', minWidth: 80 }}>
            {name}
          </Typography>
        </>
      ) : (
        <>
          <Typography sx={{ fontFamily: 'monospace' }}>{name} (</Typography>
          <TextField
            size="small"
            placeholder={placeholder}
            value={input}
            onChange={handleInputChange}
            sx={{ flexGrow: 1 }}
          />
          <Typography sx={{ fontFamily: 'monospace' }}>)</Typography>
        </>
      )}
      <Button size="small" variant="contained" onClick={handleClick}>
        Try
      </Button>
    </Box>
  );
});

/**
 * Individual DocItem as memoized component
 */
const DocItemAccordion = memo(function DocItemAccordion({
  name,
  item,
  expanded,
  onChange,
  onTry,
  renderResult,
  isFilter
}: {
  name: string;
  item: DocItem;
  expanded: boolean;
  onChange: (_: any, isExpanded: boolean) => void;
  onTry: (name: string, inputStr: string) => void;
  renderResult?: RenderResult;
  isFilter?: boolean;
}) {
  return (
    <Accordion
      key={name}
      expanded={expanded}
      onChange={onChange}
      disableGutters
      square
      sx={(theme) => ({
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        '&:not(:last-of-type)': { borderBottom: 'none' },
        '&:before': { display: 'none' },
        '& .MuiAccordionSummary-root': {
          minHeight: 44,
          transition: 'background-color 120ms ease',
          '&:hover': { backgroundColor: theme.palette.action.hover }
        },
        '&.Mui-expanded': {
          backgroundColor: theme.palette.background.default
        }
      })}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box
          display="flex"
          alignItems="center"
          gap={1}
          flexWrap="wrap"
          sx={{ flexGrow: 1 }}
        >
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
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
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
          <Typography variant="body2" color="text.secondary" fontStyle="italic">
            No documentation available.
          </Typography>
        )}

        {expanded && item.type === 'function' && (
          <TryInput
            name={name}
            signature={item.signature}
            onTry={onTry}
            isFilter={isFilter}
          />
        )}

        {renderResult && (
          <Box
            mt={2}
            p={1}
            bgcolor="#222"
            borderRadius={1}
            fontFamily="monospace"
            whiteSpace="pre-wrap"
            sx={{ color: 'white' }}
          >
            {renderResult.loading && (
              <Typography color="info.main">Loading...</Typography>
            )}
            {renderResult.output && (
              <Typography color="success.main">
                {renderResult.output.result}
              </Typography>
            )}
            {renderResult.error && (
              <Typography color="error.main">
                Error: {renderResult.error}
              </Typography>
            )}
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
});

/**
 * Reusable section renderer
 */
function DocSection({
  title,
  items,
  pluginPackage,
  isFilter = false
}: {
  title: string;
  items: Record<string, DocItem>;
  pluginPackage: string;
  isFilter?: boolean;
}) {
  const [expanded, setExpanded] = useState<string | false>(false);
  const [renderResults, setRenderResults] = useState<
    Record<string, RenderResult>
  >({});

  const handleAccordionChange = useCallback(
    (panel: string) => (_: any, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    },
    []
  );

  const handleTryRender = useCallback(
    async (name: string, inputStr: string) => {
      // Template changes depending on globals vs filters
      const tpl = isFilter
        ? `{{ ${inputStr} | ${name} }}`
        : `{{ ${name}(${inputStr}) }}`;

      setRenderResults((prev) => ({
        ...prev,
        [name]: { loading: true }
      }));

      try {
        const output = await api.renderTemplate(pluginPackage, tpl, {});
        setRenderResults((prev) => ({
          ...prev,
          [name]: { loading: false, output }
        }));
      } catch (error: any) {
        setRenderResults((prev) => ({
          ...prev,
          [name]: { loading: false, error: error.message || 'Render error' }
        }));
      }
    },
    [pluginPackage, isFilter]
  );

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

      {Object.entries(items).map(([name, item]) => {
        const isExpanded = expanded === name;
        const result = renderResults[name];
        return (
          <DocItemAccordion
            key={name}
            name={name}
            item={item}
            expanded={isExpanded}
            onChange={handleAccordionChange(name)}
            onTry={handleTryRender}
            renderResult={result}
            isFilter={isFilter}
          />
        );
      })}
    </Box>
  );
}

/**
 * Main component
 */
export default function JinjaEnvDocs({ data, pluginPackage }: Props) {
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

      <DocSection
        title="Globals"
        items={filteredGlobals}
        pluginPackage={pluginPackage}
        isFilter={false}
      />
      <DocSection
        title="Filters"
        items={filteredFilters}
        pluginPackage={pluginPackage}
        isFilter={true}
      />
    </Box>
  );
}
