import { useEffect, useState } from 'react';
import { List, ListItem, ListItemText } from '@mui/material';
import { Deal } from './type';

export default function Deals({
  registry: {
    formContext: { pluginPackage },
  },
}: ConfigFieldProps<PluginPageData>) {
  const [deals, setDeals] = useState<Deal[]>([]);

  const load = async () => {
    const res = JSON.parse(
      await api.renderTemplate(
        pluginPackage,
        `{{ get_deals() | pick('id','title','value','stage','company_id','created_at') | tojson }}`,
        {},
      ),
    );
    setDeals(res);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <List>
      {deals.map((d) => (
        <ListItem key={d.id}>
          <ListItemText primary={d.title} secondary={`$${d.value}`} />
        </ListItem>
      ))}
    </List>
  );
}
