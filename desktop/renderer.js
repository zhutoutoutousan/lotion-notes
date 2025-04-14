const { ipcRenderer } = require('electron');
const React = require('react');
const ReactDOM = require('react-dom');
const App = require('./src/App').default;

// Initialize React application
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// Expose IPC methods to the React application
window.electron = {
  store: {
    get: (key) => ipcRenderer.invoke('store:get', key),
    set: (key, value) => ipcRenderer.invoke('store:set', key, value),
    delete: (key) => ipcRenderer.invoke('store:delete', key)
  }
}; 