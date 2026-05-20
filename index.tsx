import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import StatsDashboard from './components/StatsDashboard';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {window.location.pathname.startsWith('/stats') ? <StatsDashboard /> : <App />}
  </React.StrictMode>
);
