import { useEffect, useState } from 'react';
import {
  TextField,
  Button,
  Typography,
  Stack,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Grid,
  Paper,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Post } from './type';

const { CodeMirror } = Components;

export default function Dashboard({
  formData: { pluginId },
  registry: {
    formContext: { pluginPackage },
  },
}: ConfigFieldProps<PluginPageData>) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [mode] = Utils.useAppColorScheme();
  const notifications = Hooks.useNotifications();

  const [editingId, setEditingId] = useState<number | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');

  const loadPosts = async () => {
    const res = await Utils.jinjaEvaluate(
      pluginPackage,
      `{{ get_posts() | pick('id' ,'title', 'description') | tojson }}`,
    );
    setPosts(res);
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setContent('');
  };

  const createPost = async () => {
    try {
      await Utils.jinjaEvaluate(
        pluginPackage,
        `{{ create_post(title, description, content) }}`,
        { title, description, content },
      );
      resetForm();
      loadPosts();
      notifications.show('Create post succeeded', {
        severity: 'success',
      });
    } catch (ex) {
      notifications.show(ex.message, { severity: 'error' });
    }
  };

  const updatePost = async () => {
    if (!editingId) return;
    try {
      await Utils.jinjaEvaluate(
        pluginPackage,
        `{{ update_post(post_id, title, description, content) }}`,
        {
          post_id: editingId,
          title,
          description,
          content,
        },
      );

      resetForm();
      loadPosts();
      notifications.show('Update post succeeded', {
        severity: 'success',
      });
    } catch (ex) {
      notifications.show(ex.message, { severity: 'error' });
    }
  };

  const startEdit = async (id: number) => {
    const post = await Utils.jinjaEvaluate(
      pluginPackage,
      `{{ get_post(id) }}`,
      { id },
    );

    if (!post) return;

    setEditingId(id);
    setTitle(post.title || '');
    setDescription(post.description || '');
    setContent(post.content || '');
  };

  const deletePost = async (id: number) => {
    if (!confirm('Delete this post?')) return;

    await Utils.jinjaEvaluate(pluginPackage, `{{ delete_post(post_id) }}`, {
      post_id: id,
    });

    // If deleting the one being edited, reset form
    if (editingId === id) {
      resetForm();
    }

    loadPosts();
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const isEditing = editingId !== null;

  return (
    <Grid container spacing={3}>
      {/* LEFT: FORM */}
      <Grid size={{ xs: 12, md: 7 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {isEditing ? `Editing post #${editingId}` : 'Create new post'}
          </Typography>

          <Stack gap={2}>
            <TextField
              label="Title"
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <CodeMirror
              onChange={(value) => setContent(value)}
              placeholder="Content"
              theme={mode}
              minHeight="400px"
              value={content}
              extensions={[Utils.markdownLang]}
            />

            <Stack direction="row" gap={2}>
              <Button
                variant="contained"
                onClick={isEditing ? updatePost : createPost}
              >
                {isEditing ? 'Update' : 'Post'}
              </Button>

              {isEditing && (
                <Button variant="outlined" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </Stack>
          </Stack>
        </Paper>
      </Grid>

      {/* RIGHT: LIST */}
      <Grid size={{ xs: 12, md: 5 }}>
        <Paper>
          <List>
            {posts.map((p) => (
              <ListItem
                key={p.id}
                component={RouterLink}
                to={`/plugins/${pluginId}/blog/${p.id}`}
                divider
                sx={{
                  textDecoration: 'none',
                  color: 'inherit',
                  pr: 16, // reserve room for action buttons
                  alignItems: 'flex-start',
                }}
                secondaryAction={
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      edge="end"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        startEdit(p.id);
                      }}
                    >
                      <AppIcon.Edit />
                    </IconButton>

                    <IconButton
                      edge="end"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        deletePost(p.id);
                      }}
                    >
                      <AppIcon.Clear />
                    </IconButton>
                  </Stack>
                }
              >
                <ListItemText
                  primary={p.title}
                  secondary={p.description}
                  sx={{
                    minWidth: 0, // IMPORTANT: allows ellipsis to work inside flex
                  }}
                  slotProps={{
                    primary: {
                      noWrap: true,
                      sx: { fontWeight: 500 },
                    },
                    secondary: {
                      noWrap: true,
                      sx: {
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      },
                    },
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Grid>
    </Grid>
  );
}
