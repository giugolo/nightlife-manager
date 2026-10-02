import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// On Apple devices the UI uses the native SF system font (Apple design language).
// Inter is bundled only as a cross-platform fallback for non-Apple devices.
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);