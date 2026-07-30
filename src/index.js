import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/noto-sans-thai';
import './index.css';
import SiteRouter from './SiteRouter';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <SiteRouter />
  </React.StrictMode>
);
