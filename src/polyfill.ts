import React from 'react';
import * as Mui from '@mui/material';
import * as Utils from '@/utils';
import * as Constants from '@/constants';
import * as RouterDom from 'react-router-dom';
import * as LightweightChart from 'lightweight-charts';
import AppIcon from './components/AppIcon';
import _ from 'lodash';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import api from './api';
import Components from './components';
import Hooks from './hooks';

dayjs.extend(utc);

// polyfill global props
Object.assign(globalThis, {
  // some global modules
  React,
  AppIcon,
  Mui,
  RouterDom,
  LightweightChart,
  // now the extended with typescript support
  Components,
  Hooks,
  api,
  Utils: { ...Utils, _, dayjs },
  Constants,
});
