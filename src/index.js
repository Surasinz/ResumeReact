import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ImpactPage, InterviewPage } from './CyberPages';
import NotFoundPage from './NotFoundPage';

const root = ReactDOM.createRoot(document.getElementById('root'));
const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
const page =
  pathname === '/impact'
    ? <ImpactPage />
    : pathname === '/interview-me'
      ? <InterviewPage />
      : pathname === '/'
        ? <App />
        : <NotFoundPage />;

root.render(
  <React.StrictMode>
    {page}
  </React.StrictMode>
);
