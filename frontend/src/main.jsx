import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ClinicProvider } from './contexts/ClinicContext';
import { AuthProvider } from './contexts/AuthContext';
import './styles/main.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClinicProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ClinicProvider>
  </React.StrictMode>,
);
