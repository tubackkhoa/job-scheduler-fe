import React, { ComponentType } from 'react';
import * as Mui from '@mui/material';
import * as Utils from '@/utils';
import * as MuiIcon from '@mui/icons-material';
import * as RouterDom from 'react-router-dom';
import * as LightweightChart from 'lightweight-charts';
import _ from 'lodash';
import dayjs from 'dayjs';
import api from './api';
import Components from './components';
import { FieldProps } from '@rjsf/utils';

// polyfill global props
Object.assign(globalThis, {
  // some global modules
  React,
  MuiIcon,
  Mui,
  RouterDom,
  LightweightChart,
  // now the extended with typescript support
  Components,
  api,
  Utils: { ...Utils, _, dayjs },
});

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
  const loader = code
    ? loadModule(Utils.createUrlFromString(await Utils.transpile(code)))
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
