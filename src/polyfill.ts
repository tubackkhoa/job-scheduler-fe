import React from 'react';
import * as Mui from '@mui/material';
import * as Utils from '@/utils';
import * as Constants from '@/constants';
import * as MuiIcon from '@mui/icons-material';
import * as RouterDom from 'react-router-dom';
import * as LightweightChart from 'lightweight-charts';
import _ from 'lodash';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import api from './api';
import Components from './components';

dayjs.extend(utc);

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
  Constants,
});
