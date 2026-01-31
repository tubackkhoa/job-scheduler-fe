import React from 'react';
import * as Mui from '@mui/material';
import * as Utils from '@/utils';
import * as MuiIcon from '@mui/icons-material';
import _ from 'lodash';
import dayjs from 'dayjs';
import { Chart } from 'chart.js/auto';
import * as RouterDom from 'react-router-dom';
import Api from './api';
import {
  CandlestickController,
  OhlcController,
  CandlestickElement,
  OhlcElement,
} from 'chartjs-chart-financial';
import 'chartjs-adapter-luxon';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import * as LightweightChart from 'lightweight-charts';
import Components from './components';

// 🔥 Register financial charts
Chart.register(
  CandlestickController,
  OhlcController,
  CandlestickElement,
  OhlcElement,
  ChartDataLabels,
);

// polyfill global props
window.React = React;
const ExtendedUtils = { ...Utils, _, dayjs };

export const globalProps = {
  React,
  MuiIcon,
  Mui,
  RouterDom,
  Chart,
  Components,
  Api,
  LightweightChart,
  Utils: ExtendedUtils,
};

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
  let loader: Promise<any>;
  if (code) {
    loader = loadModule(Utils.createUrlFromString(await Utils.transpile(code)));
  } else if (url.startsWith(Utils.gzipPrefix)) {
    loader = loadModule(
      Utils.createUrlFromString(
        await Utils.decodeGzip(url.slice(Utils.gzipPrefix.length)),
      ),
    );
  } else {
    loader = libModules[`../libs/${url}`]?.() ?? loadModule(url);
  }

  if (!loader) {
    throw new Error('Module loader is undefined');
  }

  const mod = await loader;
  return mod;
};
