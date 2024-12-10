import React, { useState } from 'react';
import {
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Link,
  Alert,
} from '@mui/material';
import { Login as LoginIcon } from '@mui/icons-material';

const LoginForm = ({ onLogin, onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await onLogin(formData);
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <Paper 
      elevation={3}
      sx={{
        p: 4,
        width: '100%',
        maxWidth: 400,
        mx: 'auto',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <Typography variant="h5" component="h1" gutterBottom align="center">
        Welcome Back
      </Typography>

      <form onSubmit={handleSubmit}>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            label="Username"
            name="username"
            type="text"
            value={formData.username}
            onChange={handleChange}
            required
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
            variant="outlined"
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          startIcon={<LoginIcon />}
          sx={{ mb: 2 }}
        >
          Login
        </Button>

        <Typography align="center">
          Don't have an account?{' '}
          <Link
            component="button"
            variant="body2"
            onClick={onSwitchToRegister}
          >
            Register here
          </Link>
        </Typography>
      </form>
    </Paper>
  );
};

export default LoginForm;
