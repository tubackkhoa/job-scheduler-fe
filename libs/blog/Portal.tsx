import { useEffect, useState } from 'react';
import { List, ListItem, ListItemText } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Post } from './type';

export default function Portal({
  formData: { id: pluginId },
  registry: {
    formContext: { pluginPackage },
  },
}: ConfigFieldProps<PluginData>) {
  const [posts, setPosts] = useState<Post[]>([]);

  const loadPosts = async () => {
    const res = await Utils.jinjaEvaluate(
      pluginPackage,
      `{{ get_posts(5) | pick('id' ,'title', 'description') | tojson }}`,
    );
    setPosts(res);
  };

  useEffect(() => {
    loadPosts();
  }, []);

  return (
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
  );
}
