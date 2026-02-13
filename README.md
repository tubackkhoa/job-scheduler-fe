# React + Vite Plugin Field Guide

This guide explains how to **develop, bundle, and register a dynamic
Field component** using **React + Vite**, **MUI**, and **RJSF**.

---

## 🚀 Getting Started

Install dependencies and start the development server:

```bash
yarn install
yarn dev
```

---

## 🧩 Creating a Dynamic Field Component

A _Field Component_ allows you to dynamically render content inside a
JSON Schema--driven form.

### 1. Define the Field Component

Create a TypeScript React component that receives injected dependencies
and returns a valid RJSF `Field`.

```tsx
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
```

---

## 📦 Bundling the Component

Once the Field component is written, bundle it into a single JavaScript
file.

```bash
node bundle.js libs/input.tsx plugins/sample_plugin/field.js
```

This produces a self-contained artifact that can be embedded into your
schema configuration.

---

## ⚙️ Registering the Dynamic Field (Python)

Use `json_schema_extra` to inject the bundled component into your UI
schema.

```python
from pathlib import Path
from pydantic import Field
from schemas import ui_schema

dynamic: str = Field(
    ...,
    json_schema_extra=ui_schema(
        {
            "ui:field": "Dynamic",
            "ui:options": {
                "code": Path("output.js").read_text()
            },
        }
    ),
)
```

---

## ✅ Summary

- Write a reusable React Field component
- Bundle it into a standalone JS file
- Inject it dynamically via `ui:field`
- Render runtime data using Jinja-powered context

This approach enables **fully dynamic, schema-driven UI extensions**
with minimal coupling.

Happy hacking! 🚀
