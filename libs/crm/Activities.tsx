import { useEffect, useState } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';

export default function Activities({
  registry: {
    formContext: { pluginPackage },
  },
}: ConfigFieldProps<PluginPageData>) {
  const [activities, setActivities] = useState<any[]>([]);

  const [contactId, setContactId] = useState('');
  const [type, setType] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  const load = async () => {
    const res = JSON.parse(
      await api.renderTemplate(
        pluginPackage,
        `{{ get_activities() | pick('id','type','subject','description','due_date','contact.name') | tojson }}`,
        {},
      ),
    );
    setActivities(res);
  };

  const create = async () => {
    await api.renderTemplate(
      pluginPackage,
      '{{ create_activity(contactId, type, subject, description) }}',
      { contactId, type, subject, description },
    );

    setContactId('');
    setType('');
    setSubject('');
    setDescription('');

    load();
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6">Create Activity</Typography>

        <Stack spacing={2} mt={2}>
          <TextField
            label="Contact ID"
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
          />

          <TextField
            label="Type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          />

          <TextField
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />

          <TextField
            label="Description"
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <Button variant="contained" onClick={create}>
            Create
          </Button>
        </Stack>
      </Paper>

      <Paper>
        <List>
          {activities.map((a) => (
            <ListItem key={a.id} divider>
              <ListItemText
                primary={a.subject}
                secondary={`${a.type} • contact ${a.contact_id}`}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Stack>
  );
}
