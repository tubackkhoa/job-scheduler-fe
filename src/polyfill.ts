import React from 'react';
import * as Mui from '@mui/material';
import * as Utils from '@/utils';
import * as Constants from '@/constants';
import * as LightweightChart from 'lightweight-charts';
import AppIcon from './components/AppIcon';
import _ from 'lodash';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import api from './api';
import Components from './components';
import Hooks from './hooks';
import storage from './storage';

dayjs.extend(utc);

// polyfill global props
Object.assign(globalThis, {
  // some global modules
  React,
  AppIcon,
  Mui,
  LightweightChart,
  // now the extended with typescript support
  Components,
  Hooks,
  api,
  Utils: { ...Utils, _, dayjs },
  Constants,
});

window.ctx = { user: storage.getUser() }; // for global access
