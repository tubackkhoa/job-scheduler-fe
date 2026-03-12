import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Divider,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';

import { Contact } from './type';

export default function ContactPage({
  formData: { contact_id },
  registry: {
    formContext: { pluginPackage },
  },
}: ConfigFieldProps<PluginPageData>) {
  const [contact, setContact] = useState<Contact>();
  const [notes, setNotes] = useState<any[]>([]);
  const [note, setNote] = useState('');

  const load = async () => {
    const c = JSON.parse(
      await api.renderTemplate(
        pluginPackage,
        '{{ get_contact(contact_id) | tojson }}',
        { contact_id },
      ),
    );
    setContact(c);

    const n = JSON.parse(
      await api.renderTemplate(
        pluginPackage,
        "{{ get_notes('contact', contact_id) | tojson }}",
        { contact_id },
      ),
    );

    setNotes(n);
  };

  const createNote = async () => {
    await api.renderTemplate(
      pluginPackage,
      "{{ create_note('contact', contact_id, content) }}",
      { contact_id, content: note },
    );
    setNote('');
    load();
  };

  useEffect(() => {
    load();
  }, []);

  if (!contact) return null;

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6">{contact.name}</Typography>
        <Typography>{contact.email}</Typography>
        <Typography>{contact.phone}</Typography>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6">Notes</Typography>

        <Stack direction="row" spacing={2}>
          <TextField
            fullWidth
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <Button variant="contained" onClick={createNote}>
            Add
          </Button>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <List>
          {notes.map((n) => (
            <ListItem key={n.id}>
              <ListItemText primary={n.content} />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Stack>
  );
}
