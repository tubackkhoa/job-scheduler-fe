import { useEffect, useState } from 'react';
import { Alert, Button, Container, Divider, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Post } from './type';

const { ReactMarkdown } = Components;

export default function Blog({
  formData: { pluginId, blog_id },
  registry: {
    formContext: { pluginPackage },
  },
}: ConfigFieldProps<PluginPageData>) {
  const [post, setPost] = useState<Post>();
  const [error, setError] = useState();
  const navigate = useNavigate();

  const loadPost = async () => {
    try {
      const res = await Utils.jinjaEvaluate(
        pluginPackage,
        `{{ get_post(blog_id) | tojson }}`,
        { blog_id },
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
    <Container>
      <Typography variant="h5">{post.title}</Typography>
      <Typography variant="body1">{post.description}</Typography>
      <Divider sx={{ mt: 4 }} />
      <ReactMarkdown>{post.content}</ReactMarkdown>
      <Button variant="contained" onClick={() => navigate(`/${pluginId}/blog`)}>
        Home
      </Button>
    </Container>
  );
}
