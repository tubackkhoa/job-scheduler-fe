import { useEffect, useState } from 'react';
import { Button, Container, Divider, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Post } from './type';

const { ReactMarkdown } = Components;

export default function Blog({
  formData,
  registry: {
    formContext: { pluginPackage },
  },
}: ConfigFieldProps<PluginPageData>) {
  const [post, setPost] = useState<Post>();
  const navigate = useNavigate();

  const loadPost = async () => {
    const res = await Utils.jinjaEvaluate(
      pluginPackage,
      `{{ get_post(blog_id) }}`,
      formData,
    );
    setPost(res);
  };

  useEffect(() => {
    loadPost();
  }, []);

  if (!post) return null;

  return (
    <Container>
      <Typography variant="h5">{post.title}</Typography>
      <Typography variant="body1">{post.description}</Typography>
      <Divider sx={{ mt: 4 }} />
      <ReactMarkdown>{post.content}</ReactMarkdown>

      <Button variant="contained" onClick={() => navigate(-1)}>
        Go back
      </Button>
    </Container>
  );
}
