import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material';
import { Link, Link as RouterLink } from 'react-router-dom';
import { Post } from './type';
import { Header } from './common';

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
      <Header link={`/${pluginId}/blog`} />
      <Container>
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
      </Container>
    </Box>
  );
}
