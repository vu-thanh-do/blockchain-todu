import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Sử dụng TextEncoder thay vì Buffer
// Đảm bảo TextEncoder có sẵn (polyfill nếu cần)
if (typeof window.TextEncoder === 'undefined') {
  console.warn('TextEncoder không được hỗ trợ trong trình duyệt này. Một số chức năng có thể không hoạt động.');
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
