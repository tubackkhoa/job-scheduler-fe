import { useEffect, useState } from 'react';
import {
  Avatar,
  Box,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Typography,
  Divider,
} from '@mui/material';
import { Contact } from './type';

export default function Portal({
  formData: { id: pluginId },
  registry: {
    formContext: { pluginPackage },
  },
}: ConfigFieldProps<PluginData>) {
  const [contacts, setContacts] = useState<Contact[]>([]);

  const load = async () => {
    const res = JSON.parse(
      await api.renderTemplate(
        pluginPackage,
        `{{ get_contacts() | pick('id','name','email','company.name') | tojson }}`,
        {},
      ),
    );

    setContacts(res.slice(0, 6)); // show only a few
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, px: 1 }}>
        Recent Contacts
      </Typography>

      <List dense disablePadding>
        {contacts.map((c, i) => (
          <Box key={c.id}>
            <ListItemButton
              component={Components.RouterLink}
              to={`/${pluginId}/contacts/${c.id}`}
              sx={{ borderRadius: 1 }}
            >
              <ListItemAvatar>
                <Avatar sx={{ width: 30, height: 30 }}>{c.name?.[0]}</Avatar>
              </ListItemAvatar>

              <ListItemText
                primary={
                  <Typography variant="body2" fontWeight={500} noWrap>
                    {c.name}
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {c.company?.name || c.email}
                  </Typography>
                }
              />
            </ListItemButton>

            {i !== contacts.length - 1 && <Divider component="li" />}
          </Box>
        ))}
      </List>
    </Box>
  );
}
