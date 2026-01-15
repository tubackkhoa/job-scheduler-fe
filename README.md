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
import React from 'react';
import * as Mui from '@mui/material';
import * as Utils from './src/utils';
import { FieldProps } from '@rjsf/utils';

interface Plugin {
  id: number;
  package: string;
  interval: number;
  description?: string | null;
}

export default function (
  { useCallback, useState, useEffect }: typeof React,
  { List, ListItemText }: typeof Mui,
  { buildJinjaContext }: typeof Utils
) {
  const DynamicField: React.FC<FieldProps> = ({ registry }) => {
    const render = useCallback(
      buildJinjaContext(
        registry.formContext.pluginPackage,
        registry.formContext.env.filters,
        registry.formContext.formData
      ),
      [registry.formContext]
    );

    const [plugins, setPlugins] = useState<Plugin[]>([]);

    useEffect(() => {
      render(`{{ get_all_plugins() | tolist | tojson }}`, {}).then(
        (plugins) => {
          console.log(plugins);
          setPlugins(plugins);
        }
      );
    }, []);

    return (
      <List disablePadding>
        {plugins.map((plugin) => (
          <ListItemText
            key={plugin.id}
            primary={plugin.package}
            secondary={plugin.description}
          />
        ))}
      </List>
    );
  };

  return DynamicField;
}
```

---

## 📦 Bundling the Component

Once the Field component is written, bundle it into a single JavaScript
file.

```bash
node bundle.js libs/input.tsx plugins/sample_plugin/field.js --base64
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
