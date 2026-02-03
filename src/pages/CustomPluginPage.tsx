import api from '@/api';
import DynamicField from '@/components/fields/DynamicField';
import { useEffect, useState } from 'react';
import { matchPath, useParams } from 'react-router-dom'; // Assuming you use React Router
import PageNotFound from './PageNotFound';

export default function CustomPluginPage({ setLoading, setError }) {
  const { plugin_id, '*': restPath } = useParams();
  const [routes, setRoutes] = useState<string[]>([]);
  const [pageProps, setPageProps] = useState(null);

  useEffect(() => {
    api.fetchRoutes(Number(plugin_id)).then(setRoutes);
  }, [plugin_id]);

  useEffect(() => {
    if (!routes.length) return;
    const load = async () => {
      setLoading(true);
      let data: any;
      // find the first match
      try {
        for (const route of routes) {
          const matched = matchPath(route, `/${restPath}`);
          if (matched) {
            const schema = await api.fetchRouteSchema(Number(plugin_id), route);
            data = { formData: matched.params, schema };
            return;
          }
        }
      } catch (ex) {
        setError(ex.message);
      } finally {
        setPageProps(data);
        setLoading(false);
      }
    };
    load();
  }, [routes, restPath]);

  if (pageProps === null) return null;

  return pageProps ? (
    <DynamicField name={plugin_id} {...pageProps} />
  ) : (
    <PageNotFound />
  );
}
