import api from '@/api';
import { useEffect, useState } from 'react';
import { matchPath, useParams } from 'react-router-dom'; // Assuming you use React Router
import PageNotFound from './PageNotFound';
import DynamicField from '@/components/fields/DynamicField';

export default function CustomPluginPage({ setLoading, setError }) {
  const { plugin_id, '*': restPath } = useParams();
  const [routes, setRoutes] = useState<RoutesResponse>();
  const [pageProps, setPageProps] = useState(null);

  useEffect(() => {
    api.fetchRoutes(Number(plugin_id)).then(setRoutes);
  }, [plugin_id]);

  useEffect(() => {
    if (!routes) return;
    const load = async () => {
      setLoading(true);
      let data: any;
      // find the first match
      try {
        for (const route of routes.routes[0]) {
          const matched = matchPath(route, `/${restPath}`);
          if (matched) {
            const pluginId = Number(plugin_id);
            const schema = await api.fetchRouteSchema(pluginId, route);
            data = {
              formData: {
                ...matched.params,
                ...routes,
                pluginId,
              } as PluginPageData,
              registry: { formContext: { pluginPackage: routes.package } },
              schema,
            };
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

  return pageProps ? <DynamicField {...pageProps} /> : <PageNotFound />;
}
