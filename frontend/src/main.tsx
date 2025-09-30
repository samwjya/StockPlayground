import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import App from './App.tsx';
import './style.css'; 
import SignUp from './auth/signup'
import SignIn from './auth/signin'


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/signup" replace />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/app" element={<App />} /> 
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)

