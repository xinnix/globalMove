import React from 'react';
import { Box } from '@mui/material';

const WaveformDisplay = ({ duration, currentTime, isPlaying }) => {
  const progress = duration ? (currentTime / duration) * 100 : 0;

  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* 波形图 */}
      <Box
        sx={{
          width: '100%',
          height: 40,
          backgroundColor: '#f5f5f5',
          borderRadius: 1,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* 静态波形 */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
          }}
        >
          {Array.from({ length: 50 }).map((_, i) => (
            <Box
              key={i}
              sx={{
                flex: 1,
                height: `${20 + Math.random() * 40}%`,
                backgroundColor: '#e0e0e0',
                minWidth: '2px',
              }}
            />
          ))}
        </Box>

        {/* 进度条 */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: `${progress}%`,
            height: '100%',
            backgroundColor: 'rgba(25, 118, 210, 0.2)',
            transition: isPlaying ? 'none' : 'width 0.1s ease',
          }}
        />

        {/* 进度指示器 */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: `${progress}%`,
            width: 2,
            height: '100%',
            backgroundColor: '#1976d2',
            transform: 'translateX(-50%)',
            transition: isPlaying ? 'none' : 'left 0.1s ease',
          }}
        />
      </Box>

      {/* 时间显示 */}
      <Box
        sx={{
          mt: 1,
          display: 'flex',
          justifyContent: 'space-between',
          color: 'text.secondary',
          fontSize: '0.75rem',
        }}
      >
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </Box>
    </Box>
  );
};

export default WaveformDisplay;
