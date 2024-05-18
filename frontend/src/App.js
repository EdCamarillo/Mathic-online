import React from 'react';
import AuthProvider from './authentication/AuthProvider';
import Routes from './routes';

function App() {
  return (
    <AuthProvider>
      <Routes />
    </AuthProvider>
  );
}

export default App;