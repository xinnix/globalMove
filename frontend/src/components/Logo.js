import React from 'react';
import { Box, Typography } from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';

const Logo = () => {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        color: '#1a237e',
      }}
    >
      <MenuBookIcon sx={{ fontSize: 40 }} />
      <Typography 
        variant="h4" 
        component="span"
        sx={{ 
          fontWeight: 700,
          background: 'linear-gradient(45deg, #1a237e 30%, #0d47a1 90%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        NoteFlow
      </Typography>
    </Box>
  );
};

export default Logo;
