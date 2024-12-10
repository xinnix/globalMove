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
import { PersonAdd as RegisterIcon } from '@mui/icons-material';

const RegisterForm = ({ onRegister, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
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

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const { confirmPassword, ...registerData } = formData;
      await onRegister(registerData);
    } catch (err) {
      setError(err.message || 'Registration failed');
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
        Create Account
      </Typography>

      <form onSubmit={handleSubmit}>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
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
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
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
          startIcon={<RegisterIcon />}
          sx={{ mb: 2 }}
        >
          Register
        </Button>

        <Typography align="center">
          Already have an account?{' '}
          <Link
            component="button"
            variant="body2"
            onClick={onSwitchToLogin}
          >
            Login here
          </Link>
        </Typography>
      </form>
    </Paper>
  );
};

export default RegisterForm;
