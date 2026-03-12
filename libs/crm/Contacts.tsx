import { useEffect, useState } from 'react';
import { TextField, Button, List, ListItem, ListItemText } from '@mui/material';
import { Contact } from './type';

export default function Contacts({
  registry: {
    formContext: { pluginPackage },
  },
}: ConfigFieldProps<PluginPageData>) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [name, setName] = useState('');

  const load = async () => {
    const res = JSON.parse(
      await api.renderTemplate(
        pluginPackage,
        `{{ get_contacts() | pick('id','name','email','company.name') | tojson }}`,
        {},
      ),
    );
    setContacts(res);
  };

  const create = async () => {
    await api.renderTemplate(pluginPackage, '{{ create_contact(name) }}', {
      name,
    });
    setName('');
    load();
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <TextField value={name} onChange={(e) => setName(e.target.value)} />
      <Button onClick={create}>Create</Button>

      <List>
        {contacts.map((c) => (
          <ListItem key={c.id}>
            <ListItemText primary={c.name} secondary={c.email} />
          </ListItem>
        ))}
      </List>
    </>
  );
}
