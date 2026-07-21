import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' 
import { CacheProvider } from '@emotion/react'    
import createCache from '@emotion/cache'          
import App from './App.jsx'
import './index.css'

// Vercel Analytics & Speed Insights
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react'; // 🟢 เพิ่ม Speed Insights เข้ามาเพื่อวัดประสิทธิภาพเว็บ

const emotionCache = createCache({ key: 'se-job' })

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CacheProvider value={emotionCache}>
      {/* เอา BrowserRouter มาครอบ App สำหรับจัดการ Routing */}
      <BrowserRouter>
        <App />
      </BrowserRouter>
      
      {/* 🟢 ระบบเก็บสถิติและวัดประสิทธิภาพของ Vercel */}
      <Analytics />
      <SpeedInsights /> 
    </CacheProvider>
  </React.StrictMode>,
)