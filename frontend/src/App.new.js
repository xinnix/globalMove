import React, { useState, useRef, useEffect } from 'react';
import { 
  Container, 
  TextField, 
  Button, 
  Paper, 
  Typography,
  Box,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import { PlayArrow, Stop, Mic, VolumeUp, Refresh } from '@mui/icons-material';
import axios from 'axios';

function App() {
  const [chineseText, setChineseText] = useState('');
  const [englishText, setEnglishText] = useState('');
  const [currentWord, setCurrentWord] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [wordDefinition, setWordDefinition] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  
  const audioRef = useRef(null);
  const synth = useRef(window.speechSynthesis);
  const recognition = useRef(null);
  const currentUtterance = useRef(null);

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window) {
      recognition.current = new window.webkitSpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = 'en-US';

      recognition.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        evaluateRecording(transcript);
      };

      recognition.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setNotification({
          open: true,
          message: 'Error recognizing speech. Please try again.',
          severity: 'error'
        });
      };
    }

    return () => {
      if (recognition.current) {
        recognition.current.stop();
      }
      if (currentUtterance.current) {
        synth.current.cancel();
      }
    };
  }, []);

  const handleTranslate = async () => {
    try {
      setLoading(true);
      const response = await axios.post('http://localhost:5000/api/translate', {
        text: chineseText
      });
      setEnglishText(response.data.translation);
      
      // Clear previous feedback
      setFeedback(null);
    } catch (error) {
      console.error('Translation error:', error);
      setNotification({
        open: true,
        message: 'Error translating text. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWordClick = async (word) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/word-definition?word=${word}`);
      setWordDefinition(response.data);
      setCurrentWord(word);
      
      // Speak the word
      speakText(word);
    } catch (error) {
      console.error('Definition lookup error:', error);
      setNotification({
        open: true,
        message: 'Error looking up word definition.',
        severity: 'error'
      });
    }
  };

  const speakText = (text) => {
    if (synth.current.speaking) {
      synth.current.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9; // Slightly slower than normal
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsPlaying(false);
      setNotification({
        open: true,
        message: 'Error playing audio. Please try again.',
        severity: 'error'
      });
    };

    currentUtterance.current = utterance;
    synth.current.speak(utterance);
  };

  const togglePlayback = () => {
    if (isPlaying) {
      synth.current.cancel();
      setIsPlaying(false);
    } else {
      speakText(englishText);
    }
  };

  const startRecording = () => {
    if (!recognition.current) {
      setNotification({
        open: true,
        message: 'Speech recognition is not supported in your browser.',
        severity: 'error'
      });
      return;
    }

    recognition.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (recognition.current) {
      recognition.current.stop();
    }
    setIsRecording(false);
  };

  const evaluateRecording = (transcript) => {
    const originalWords = englishText.toLowerCase().split(/\s+/);
    const spokenWords = transcript.toLowerCase().split(/\s+/);
    
    const results = originalWords.map(word => {
      const isCorrect = spokenWords.includes(word);
      return {
        word,
        correct: isCorrect,
        feedback: isCorrect ? 'Correct' : 'Incorrect - Try again'
      };
    });

    const score = Math.round((results.filter(r => r.correct).length / results.length) * 100);

    setFeedback({
      score,
      details: results,
      transcript
    });

    setNotification({
      open: true,
      message: `Pronunciation score: ${score}%`,
      severity: score >= 80 ? 'success' : 'warning'
    });
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Language Learning Notes
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <TextField
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          label="Chinese Text"
          value={chineseText}
          onChange={(e) => setChineseText(e.target.value)}
          sx={{ mb: 2 }}
        />
        
        <Button
          variant="contained"
          onClick={handleTranslate}
          disabled={loading || !chineseText}
          sx={{ mb: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Translate'}
        </Button>
      </Paper>

      {englishText && (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            English Translation
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            {englishText.split(' ').map((word, index) => (
              <span
                key={index}
                onClick={() => handleWordClick(word)}
                style={{
                  cursor: 'pointer',
                  margin: '0 4px',
                  backgroundColor: currentWord === word ? '#e3f2fd' : 'transparent',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  color: feedback?.details?.find(d => d.word.toLowerCase() === word.toLowerCase())?.correct 
                    ? 'green' 
                    : feedback?.details?.find(d => d.word.toLowerCase() === word.toLowerCase()) 
                      ? 'red' 
                      : 'inherit'
                }}
              >
                {word}
              </span>
            ))}
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Tooltip title={isPlaying ? "Stop" : "Play"}>
              <IconButton onClick={togglePlayback}>
                {isPlaying ? <Stop /> : <PlayArrow />}
              </IconButton>
            </Tooltip>
            
            <Tooltip title={isRecording ? "Stop Recording" : "Start Recording"}>
              <IconButton 
                onClick={isRecording ? stopRecording : startRecording}
                color={isRecording ? "error" : "default"}
              >
                <Mic />
              </IconButton>
            </Tooltip>

            {feedback && (
              <Typography variant="body2" sx={{ ml: 2 }}>
                Score: {feedback.score}%
              </Typography>
            )}
          </Box>

          {feedback && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                You said: {feedback.transcript}
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {wordDefinition && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Word Definition: {currentWord}
          </Typography>
          {wordDefinition.definitions?.map((def, index) => (
            <Box key={index} sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                {def.partOfSpeech}
              </Typography>
              <Typography>
                {def.definition}
              </Typography>
              {def.example && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Example: {def.example}
                </Typography>
              )}
            </Box>
          ))}
        </Paper>
      )}

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default App;
