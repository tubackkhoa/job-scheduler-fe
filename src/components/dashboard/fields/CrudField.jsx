import { useState, useEffect, useRef, useCallback } from "react";
import _ from "lodash";
import {
  Stack,
  Typography,
  Box,
  Autocomplete,
  TextField,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Save, Delete, Add, Refresh } from "@mui/icons-material";
import { buildJinjaContext } from "../../../utils";
import { ConfirmationDialog } from "../ConfirmationDialog";

export function CrudField({
  formData,
  onChange,
  schema,
  fieldPathId,
  registry,
}) {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Create dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({});
  const [creating, setCreating] = useState(false);

  const createSchema = schema["ui:options"]?.createSchema;

  // Build context with dependencies
  const render = useCallback(
    buildJinjaContext(
      registry.formContext.pluginPackage,
      registry.formContext.env.filters,
      registry.formContext.formData
    ),
    [registry.formContext]
  );

  // Generic evaluate wrapper
  const evaluateExpr = useCallback(
    (exprKey, data) => render(schema['model:expr'][exprKey], data),
    [schema, render]
  );

  // CRUD operations
  const listItems = useCallback(
    (field_id, searchTerm = "", limit = 20, offset = 0) =>
      evaluateExpr("list", { field_id, search: searchTerm, limit, offset }),
    [evaluateExpr]
  );

  const createItem = useCallback(
    (payload) => evaluateExpr("create", { payload }),
    [evaluateExpr]
  );

  const deleteItem = useCallback(
    (key) => evaluateExpr("delete", {key}),
    [evaluateExpr]
  );

  // Debounced search
  const debounceTimeout = useRef(null);

  const refreshList = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await listItems(fieldPathId?.$id, searchInput);
      const list = result?.versions || result?.items || [];
      setItems(list);

      // If formData exists, select corresponding item
      if (formData) {
        const matched = list.find(
          (v) => v.id === formData || v.key === formData
        );
        if (matched) {
          setSelectedItem(matched);
        }
      }
    } catch (e) {
      setItems([]);
      setError(e.message || "Failed to load items");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [fieldPathId, searchInput, formData, listItems]);

  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    debounceTimeout.current = setTimeout(() => {
      refreshList();
    }, 300);

    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [searchInput, formData, refreshList]);

  const handleSelect = async (item) => {
    if (!item) {
      setSelectedItem(null);
      onChange("", schema["model:binding"]);
      return;
    }

    setSelectedItem(item);
    setMessage("");
    setError("");

    // Set the value (key or id) to the binding path
    const value = item.key || item.id || item.name;
    onChange(value, schema["model:binding"]);
  };

  // Create dialog handlers
  const handleOpenCreateDialog = () => {
    setCreateFormData({});
    setCreateDialogOpen(true);
  };

  const handleCreateFormChange = (field, value) => {
    setCreateFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreate = async () => {
    setCreating(true);
    setError("");
    setMessage("");

    try {
      const payload = { ...createFormData, status: "active" };

      // Parse detail field as JSON if it's a string
      if (payload.detail && typeof payload.detail === "string") {
        try {
          payload.detail = JSON.parse(payload.detail);
        } catch {
          payload.detail = {};
        }
      }

      const result = await createItem(payload);
      setMessage(`Created: ${result.name || result.key || result.id}`);
      setCreateDialogOpen(false);
      setCreateFormData({});

      // Refresh list
      await refreshList();

      // Select the newly created item
      if (result) {
        setSelectedItem(result);
        onChange(result.key || result.id, schema["model:binding"]);
      }
    } catch (e) {
      setError(e.message || "Failed to create item");
    } finally {
      setCreating(false);
    }
  };

  // Delete handlers
  const handleDeleteClick = () => {
    if (!selectedItem) {
      setError("Please select an item to deactivate");
      return;
    }
    setDeleteDialogOpen(true);
  };

  const doDelete = async () => {
    setDeleteDialogOpen(false);
    if (!selectedItem) return;

    setDeleting(true);
    setError("");
    setMessage("");

    try {
      const key = selectedItem.key || selectedItem.id;
      await deleteItem(key);
      setMessage(`Deactivated: ${selectedItem.name || key}`);

      // Reset selection
      setSelectedItem(null);
      onChange("", schema["model:binding"]);

      // Refresh list
      await refreshList();
    } catch (e) {
      setError(e.message || "Failed to deactivate item");
    } finally {
      setDeleting(false);
    }
  };

  // Render create form fields from schema
  const renderCreateFormFields = () => {
    if (!createSchema?.properties) return null;

    return Object.entries(createSchema.properties).map(([key, fieldSchema]) => (
      <TextField
        key={key}
        fullWidth
        size="small"
        label={fieldSchema.title || key}
        value={createFormData[key] || ""}
        onChange={(e) => handleCreateFormChange(key, e.target.value)}
        required={createSchema.required?.includes(key)}
        multiline={key === "description" || key === "detail"}
        rows={key === "detail" ? 4 : key === "description" ? 2 : 1}
        placeholder={key === "detail" ? '{"key": "value"}' : ""}
        sx={{ mb: 1.5 }}
      />
    ));
  };

  return (
    <Box
      sx={{
        p: 1.5,
        bgcolor: "rgba(99, 102, 241, 0.08)",
        borderRadius: 1,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Stack spacing={1.5}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <Autocomplete
            size="small"
            options={items}
            getOptionLabel={(option) => option.name || option.key || ""}
            value={selectedItem}
            onChange={(_, v) => handleSelect(v)}
            inputValue={searchInput}
            onInputChange={(_, val) => setSearchInput(val)}
            loading={loading}
            sx={{ flex: 1, minWidth: 200 }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={schema.title}
                placeholder="Type to search..."
              />
            )}
            renderOption={({ key, ...props }, option) => (
              <Box component="li" key={option.id || option.key} {...props}>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ width: "100%" }}
                >
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {option.name}
                  </Typography>
                  {option.status === "active" && (
                    <Chip label="Active" size="small" color="success" />
                  )}
                  <Typography variant="caption" color="text.secondary">
                    {option.key || option.id}
                  </Typography>
                </Stack>
              </Box>
            )}
          />

          <IconButton size="small" onClick={refreshList} disabled={loading}>
            <Refresh />
          </IconButton>

          {createSchema && (
            <Button
              variant="contained"
              size="small"
              startIcon={<Add />}
              onClick={handleOpenCreateDialog}
              sx={{ minWidth: 100 }}
            >
              Create
            </Button>
          )}

          {selectedItem && (
            <IconButton
              size="small"
              color="error"
              onClick={handleDeleteClick}
              disabled={deleting}
              title="Deactivate"
            >
              <Delete />
            </IconButton>
          )}
        </Stack>

        {message && (
          <Typography variant="caption" color="success.main">
            {message}
          </Typography>
        )}

        {error && (
          <Typography variant="caption" color="error.main">
            {error}
          </Typography>
        )}
      </Stack>

      {/* Create Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New {schema.title || "Item"}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>{renderCreateFormFields()}</Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={creating || !createFormData.key || !createFormData.name}
          >
            {creating ? "Creating..." : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={doDelete}
        title="Deactivate Item"
        message="Are you sure you want to deactivate this item?"
        details={`This will deactivate "${selectedItem?.name}". The item will be marked as inactive.`}
        severity="warning"
        confirmText="Deactivate"
        isLoading={deleting}
      />
    </Box>
  );
}
