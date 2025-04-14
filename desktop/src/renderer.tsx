import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

// Initialize React application
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Expose IPC methods to the React application
window.electron = {
  store: {
    get: (key: string) => window.ipcRenderer.invoke('store:get', key),
    set: (key: string, value: any) => window.ipcRenderer.invoke('store:set', key, value),
    delete: (key: string) => window.ipcRenderer.invoke('store:delete', key)
  }
}; 