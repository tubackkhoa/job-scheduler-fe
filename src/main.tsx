import React, { StrictMode } from 'react';
import * as Mui from '@mui/material';
import * as Utils from '@/utils';
import * as MuiIcon from '@mui/icons-material';
import _ from 'lodash';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './auth/AuthProvider';
import './index.css';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';

// polyfill global props
window.React = React;
const ExtendedMui = { ...Mui, ConfirmationDialog };
const ExtendedUtils = { ...Utils, _ };
window.globalProps = {
  React,
  MuiIcon,
  Mui: ExtendedMui,
  Utils: ExtendedUtils
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);
