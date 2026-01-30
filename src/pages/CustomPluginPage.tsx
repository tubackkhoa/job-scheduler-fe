import api from '@/api';
import DynamicField from '@/components/fields/DynamicField';
import { useEffect, useState } from 'react';
import { matchPath, useParams } from 'react-router-dom'; // Assuming you use React Router
import PageNotFound from './PageNotFound';

export default function CustomPluginPage() {
  const { plugin_id, '*': restPath } = useParams();
  const [routes, setRoutes] = useState<[string, CodeSchema][]>([]);
  const [pageProps, setPageProps] = useState(null);

  useEffect(() => {
    api.fetchRoutes(Number(plugin_id)).then(setRoutes);
  }, [plugin_id]);

  useEffect(() => {
    if (!routes.length) return;
    // find the first match
    for (const [route, schema] of routes) {
      const matched = matchPath(route, `/${restPath}`);
      if (matched) {
        setPageProps({ formData: matched.params, schema });
        return;
      }
    }
    setPageProps(false);
  }, [routes, restPath]);

  if (pageProps === null) return null;

  return pageProps ? (
    <DynamicField name={plugin_id} {...pageProps} />
  ) : (
    <PageNotFound />
  );
}
