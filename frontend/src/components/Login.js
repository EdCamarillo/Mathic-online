import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../authentication/AuthProvider';
import { Container, Box, Typography, TextField, Button, Paper } from '@mui/material';
import { ReactComponent as ReactLogo } from '../logo.svg';
import '../App.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { setToken } = useAuth();
  
  useEffect(() => {
    localStorage.removeItem('token');
    setToken(null);
  }, [setToken]);

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
      setToken(data.token);
      navigate('/home'); // Redirect to home upon successful login
    } catch (error) {
      setError('Login failed. Please try again.');
      console.error('Login failed', error);
    }
  };

  return (
    <Container sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', flexGrow: 1 }}>
        <ReactLogo style={{ width: 'auto', height: '100%' }} />
        <Typography variant="h1" component="h1" sx={{ textAlign: 'left', ml: 2 }}>
          Mathic<br />matic
        </Typography>
      </Box>
      <Paper sx={{ padding: 4, width: '400px', marginLeft: 30 }}>
        <Typography variant="h4" component="h2" gutterBottom>
          Login
        </Typography>
        {error && <Typography color="error">{error}</Typography>}
        <form onSubmit={handleSubmit}>
          <TextField
            label="Email"
            variant="outlined"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Password"
            type="password"
            variant="outlined"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 3 }}>
            Login
          </Button>
        </form>
        <Typography variant="body2" align="center" sx={{ mt: 2 }}>
          Don't have an account? <Link to="/signup">Sign up</Link>
        </Typography>
      </Paper>
    </Container>
  );
};

export default Login;