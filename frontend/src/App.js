import React from 'react';
import AuthProvider from './authentication/AuthProvider';
import Routes from './routes';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Routes />
    </AuthProvider>
  );
}

export default App;