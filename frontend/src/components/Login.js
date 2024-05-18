import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../authentication/AuthProvider';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { setToken } = useAuth();
  
  useEffect(() => {
    localStorage.removeItem('token');
    setToken(null);
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8080/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }
  
      const data = await response.json();
      // localStorage.setItem('token', data.token); // Store token in local storage
      setToken(data.token);
      navigate('/home'); // Redirect to home upon successful login
    } catch (error) {
      setError('Login failed. Please try again.');
      console.error('Login failed', error);
    }
  };

  const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      return false;
    }
  
    // Additional checks if needed, e.g., token expiration, validation
  
    return true;
  };

  return (
    <div>
      <h2>Login</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>} {/* Display error message */}
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;