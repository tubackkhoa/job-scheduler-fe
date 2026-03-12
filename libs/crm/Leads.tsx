import { useEffect, useState } from 'react';
import { List, ListItem, ListItemText } from '@mui/material';
import { Lead } from './type';

export default function Leads({
  registry: {
    formContext: { pluginPackage },
  },
}: ConfigFieldProps<PluginPageData>) {
  const [leads, setLeads] = useState<Lead[]>([]);

  const load = async () => {
    const res = JSON.parse(
      await api.renderTemplate(
        pluginPackage,
        `{{ get_leads() | pick('id','name','email','source','status','created_at') | tojson }}`,
        {},
      ),
    );
    setLeads(res);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <List>
      {leads.map((l) => (
        <ListItem key={l.id}>
          <ListItemText primary={l.name} secondary={l.source} />
        </ListItem>
      ))}
    </List>
  );
}
