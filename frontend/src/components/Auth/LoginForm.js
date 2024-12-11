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
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const LoginForm = () => {
  const [showLogin, setShowLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError(t('auth.fieldsRequired'));
      return;
    }

    try {
      const credentials = { username, password };
      if (showLogin) {
        await login(credentials);
      } else {
        await register(credentials);
        setShowLogin(true);
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError(error.message || t('auth.generalError'));
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
        {showLogin ? t('auth.loginTitle') : t('auth.registerTitle')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label={t('auth.username')}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          margin="normal"
          required
          autoFocus
        />
        <TextField
          fullWidth
          type="password"
          label={t('auth.password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          margin="normal"
          required
        />
        <Button
          fullWidth
          type="submit"
          variant="contained"
          color="primary"
          sx={{ mt: 3, mb: 2 }}
          startIcon={<LoginIcon />}
        >
          {showLogin ? t('auth.login') : t('auth.register')}
        </Button>
      </form>

      <Box textAlign="center">
        <Link
          component="button"
          variant="body2"
          onClick={() => setShowLogin(!showLogin)}
        >
          {showLogin ? t('auth.switchToRegister') : t('auth.switchToLogin')}
        </Link>
      </Box>
    </Paper>
  );
};

export default LoginForm;
