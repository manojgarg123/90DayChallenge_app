import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { isMissingConfig } from './lib/supabase.ts'

if (isMissingConfig) {
  document.getElementById('root')!.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0f0f1a;font-family:Inter,sans-serif;padding:24px">
      <div style="max-width:480px;background:#1e1e2e;border:1px solid #2a2a3e;border-radius:24px;padding:32px;text-align:center">
        <div style="font-size:48px;margin-bottom:16px">⚙️</div>
        <h1 style="color:#c4b5fd;font-size:20px;margin:0 0 8px">Missing Supabase Configuration</h1>
        <p style="color:#9ca3af;font-size:14px;margin:0 0 24px;line-height:1.6">
          The app needs your Supabase credentials to run.
          Create a <code style="background:#0f0f1a;padding:2px 6px;border-radius:6px;color:#a78bfa">.env</code> file
          in the project root with the following:
        </p>
        <pre style="background:#0f0f1a;border-radius:12px;padding:16px;text-align:left;color:#86efac;font-size:13px;overflow:auto">VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-key-here</pre>
        <p style="color:#6b7280;font-size:12px;margin:16px 0 0">
          Find these values in your Supabase project → Settings → API.<br/>
          Then restart the dev server with <code style="color:#a78bfa">npm run dev</code>.
        </p>
      </div>
    </div>
  `
} else {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}
