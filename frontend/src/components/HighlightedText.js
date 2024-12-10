import React from 'react';
import { Box } from '@mui/material';

const HighlightedText = ({ text, currentWord }) => {
  if (!text) return null;

  const words = text.split(' ');

  return (
    <Box sx={{ lineHeight: 1.6 }}>
      {words.map((word, index) => (
        <Box
          key={index}
          component="span"
          sx={{
            display: 'inline-block',
            padding: '0 2px',
            margin: '0 1px',
            borderRadius: 1,
            backgroundColor: index === currentWord ? '#1976d2' : 'transparent',
            color: index === currentWord ? '#fff' : 'inherit',
            transition: 'all 0.2s ease',
          }}
        >
          {word}
        </Box>
      ))}
    </Box>
  );
};

export default HighlightedText;
