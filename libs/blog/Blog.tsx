import { useEffect, useState } from 'react';
import { Alert, Box, Container, Divider, Typography } from '@mui/material';
import { Post } from './type';
import { Header } from './common';

const { MarkdownPreview } = Components;

export default function Blog({
  formData: { pluginId, blog_id },
  registry: {
    formContext: { pluginPackage },
  },
}: ConfigFieldProps<PluginPageData>) {
  const [post, setPost] = useState<Post>();
  const [error, setError] = useState();

  const loadPost = async () => {
    try {
      const res = JSON.parse(
        await api.renderTemplate(
          pluginPackage,
          `{{ get_post(blog_id) | tojson }}`,
          { blog_id },
        ),
      );
      setPost(res);
    } catch (ex) {
      setError(ex.message);
    }
  };

  useEffect(() => {
    loadPost();
  }, []);

  if (error)
    return (
      <Alert variant="outlined" severity="error" sx={{ mb: 4 }}>
        {error}
      </Alert>
    );

  if (!post) return null;

  return (
    <Box>
      <Header link={`/${pluginId}/blog`} />
      <Container>
        <Typography variant="h5">{post.title}</Typography>
        <Typography variant="body1">{post.description}</Typography>
        <Divider sx={{ mt: 4 }} />
        <MarkdownPreview text={post.content} maxHeight="auto" />
      </Container>
    </Box>
  );
}
