import { useEffect, useState } from 'react';
import { Box, List, ListItem, ListItemText, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Post } from './type';

export default function Portal({
  formData: { pluginId },
  registry: {
    formContext: { pluginPackage },
  },
}: ConfigFieldProps<PluginPageData>) {
  const [posts, setPosts] = useState<Post[]>([]);

  const loadPosts = async () => {
    const res = await Utils.jinjaEvaluate(
      pluginPackage,
      `{{ get_posts() | pick('id' ,'title', 'description') | tojson }}`,
    );
    setPosts(res);
  };

  useEffect(() => {
    loadPosts();
  }, []);

  return (
    <Box>
      <Typography
        variant="h5"
        fontWeight={600}
        sx={{ mb: 2, textAlign: 'center' }}
      >
        Blog Plugin
      </Typography>
      <List>
        {posts.map((p) => (
          <ListItem
            key={p.id}
            component={RouterLink}
            to={`/${pluginId}/blog/${p.id}`}
            divider
            sx={{ textDecoration: 'none', color: 'inherit' }}
          >
            <ListItemText primary={p.title} secondary={p.description} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
