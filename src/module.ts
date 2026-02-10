import React, { ComponentType } from 'react';
import { FieldProps } from '@rjsf/utils';

// known at build time
// Define the shape of your expected module
export const libModules = import.meta.env.DEV
  ? import.meta.glob('../libs/**/*.{ts,js,tsx,jsx}')
  : {};

export const loadModule = (modUrl: string) => import(/* @vite-ignore */ modUrl);

export const getModule = async ({
  url,
  code,
}: CodeSchema): Promise<ModuleCode> => {
  // only transpile if this looks like typescript with import ...
  const loader = code
    ? loadModule(
        Utils.createUrlFromString(
          /^\s*import\s+/.test(code) ? await Utils.transpile(code) : code,
        ),
      )
    : (libModules[`../libs/${url}`]?.() ?? loadModule(url));

  if (!loader) {
    throw new Error('Module loader is undefined');
  }

  return loader;
};

// this help hot-reloading
const lazyCache = new Map<
  string,
  React.LazyExoticComponent<ComponentType<FieldProps>>
>();

export const getLazyModule = (url?: string, code?: string) => {
  if (!url && !code) return {};
  const key = url ?? Utils.getCodeHash(code);

  if (!lazyCache.has(key)) {
    lazyCache.set(
      key,
      React.lazy(() => getModule({ url, code })),
    );
  }

  return { key, Component: lazyCache.get(key) };
};
