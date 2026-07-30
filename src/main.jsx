import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import App from './App.jsx';
import './index.css';

// กำหนดค่าเริ่มต้นให้กับ Sentry
Sentry.init({
  dsn: "https://b58aa96fd02a9eefa5c0635e2c884d9b@o4511642276724736.ingest.us.sentry.io/4511642278887424", // 🟢 ใส่ DSN ของโปรเจกต์คุณตรงนี้
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0, 
  // Session Replay
  replaysSessionSampleRate: 0.1, 
  replaysOnErrorSampleRate: 1.0, 
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 🟢 ต้องเอา BrowserRouter มาคลุม App ไว้ที่ชั้นนอกสุดแบบนี้ครับ */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);