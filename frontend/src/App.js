import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  AppBar,
  Toolbar,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Translate,
  VolumeUp,
  Create,
  Book,
  AccountCircle,
  ExitToApp,
} from '@mui/icons-material';
import Logo from './components/Logo';
import WaveformDisplay from './components/WaveformDisplay';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import { useAuth } from './contexts/AuthContext';
import { notes as notesApi } from './services/api';

function App() {
  const { user, login, register, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(true);
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);

  const steps = ['Take Notes', 'Translate', 'Listen & Practice', 'Review & Memorize'];

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleCloseMenu();
    logout();
  };

  const handleLoginSuccess = async (credentials) => {
    try {
      await login(credentials);
      loadNotes();
    } catch (error) {
      throw error;
    }
  };

  const handleRegisterSuccess = async (userData) => {
    try {
      await register(userData);
      loadNotes();
    } catch (error) {
      throw error;
    }
  };

  const loadNotes = async () => {
    try {
      const response = await notesApi.getAll();
      setNotes(response);
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const handleNoteSubmit = async () => {
    if (!currentNote.trim()) return;

    try {
      const response = await notesApi.create({
        text: currentNote,
      });
      
      setNotes([response, ...notes]);
      setCurrentNote('');
      setActiveStep(1);
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const handleTranslate = async (noteId) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    setIsTranslating(true);
    try {
      const response = await fetch('http://localhost:5002/api/v1/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ text: note.text }),
      });

      const data = await response.json();
      const updatedNotes = notes.map(n => {
        if (n.id === noteId) {
          return { ...n, translated_text: data.translatedText };
        }
        return n;
      });

      setNotes(updatedNotes);
      await notesApi.update(noteId, { translated_text: data.translatedText });
      setActiveStep(2);
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  const generateAudio = async (noteId) => {
    const note = notes.find(n => n.id === noteId);
    if (!note || !note.translated_text) return;

    try {
      const response = await fetch('http://localhost:5002/api/v1/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ text: note.translated_text }),
      });

      const data = await response.json();
      const updatedNotes = notes.map(n => {
        if (n.id === noteId) {
          return { ...n, audio_url: data.audioUrl };
        }
        return n;
      });

      setNotes(updatedNotes);
      await notesApi.update(noteId, { audio_url: data.audioUrl });
      setActiveStep(3);
    } catch (error) {
      console.error('Error generating audio:', error);
    }
  };

  const handleAudioPlay = async (url) => {
    try {
      const audio = new Audio(url);
      await audio.play();
      setIsPlaying(true);
      audio.onended = () => {
        setIsPlaying(false);
      };
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    }
  };

  const handleAudioPause = () => {
    setIsPlaying(false);
  };

  const startPractice = async (noteId) => {
    const note = notes.find(n => n.id === noteId);
    if (!note || !note.audio_url) return;

    try {
      await handleAudioPlay(note.audio_url);
      setActiveStep(3);
    } catch (error) {
      console.error('Error starting practice:', error);
    }
  };

  if (!user) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          py: { xs: 2, md: 4 },
          px: { xs: 1, md: 0 },
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Container maxWidth="sm">
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Logo />
          </Box>
          {showLogin ? (
            <LoginForm
              onLogin={handleLoginSuccess}
              onSwitchToRegister={() => setShowLogin(false)}
            />
          ) : (
            <RegisterForm
              onRegister={handleRegisterSuccess}
              onSwitchToLogin={() => setShowLogin(true)}
            />
          )}
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar>
          <Logo />
          <Box sx={{ flexGrow: 1 }} />
          <Box>
            <IconButton
              size="large"
              onClick={handleMenu}
              color="inherit"
            >
              <AccountCircle />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleCloseMenu}
            >
              <MenuItem disabled>
                <Typography variant="body2" color="textSecondary">
                  {user.email}
                </Typography>
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ExitToApp sx={{ mr: 1 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          flex: 1,
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          py: { xs: 2, md: 4 },
          px: { xs: 1, md: 0 },
        }}
      >
        <Container 
          maxWidth="md" 
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          <Paper 
            elevation={3} 
            sx={{ 
              p: { xs: 2, md: 3 },
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              borderRadius: 2,
            }}
          >
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <Box sx={{ mb: 4 }}>
              <TextField
                fullWidth
                multiline
                rows={4}
                variant="outlined"
                placeholder="Write your notes here..."
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#fff',
                  },
                }}
              />
              <Button
                variant="contained"
                onClick={handleNoteSubmit}
                startIcon={<Create />}
                disabled={!currentNote.trim()}
              >
                Save Note
              </Button>
            </Box>

            <Box sx={{ mb: 4 }}>
              {notes.map((note) => (
                <Paper
                  key={note.id}
                  elevation={1}
                  sx={{ 
                    p: 2, 
                    mb: 2, 
                    backgroundColor: '#fff',
                    position: 'relative',
                  }}
                >
                  <Typography variant="body1" paragraph>
                    {note.text}
                  </Typography>
                  
                  {note.translated_text && (
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      paragraph
                      sx={{ borderLeft: '3px solid #1976d2', pl: 2 }}
                    >
                      {note.translated_text}
                    </Typography>
                  )}

                  {note.audio_url && (
                    <WaveformDisplay
                      audioUrl={note.audio_url}
                      onPlayStateChange={(playing) => {
                        if (playing) {
                          handleAudioPlay(note.audio_url);
                        } else {
                          handleAudioPause();
                        }
                      }}
                      onTimeUpdate={setCurrentTime}
                    />
                  )}

                  <Box sx={{ 
                    display: 'flex', 
                    gap: 1,
                    mt: 2,
                    justifyContent: 'flex-end',
                  }}>
                    {!note.translated_text && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleTranslate(note.id)}
                        startIcon={<Translate />}
                        disabled={isTranslating}
                      >
                        Translate
                      </Button>
                    )}
                    
                    {note.translated_text && !note.audio_url && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => generateAudio(note.id)}
                        startIcon={<VolumeUp />}
                      >
                        Generate Audio
                      </Button>
                    )}

                    {note.audio_url && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => startPractice(note.id)}
                        startIcon={<Book />}
                      >
                        Practice
                      </Button>
                    )}
                  </Box>
                </Paper>
              ))}
            </Box>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
}

export default App;