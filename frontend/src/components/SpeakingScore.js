import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';

const ScoreItem = ({ label, score, color }) => (
  <Box sx={{ mb: 1 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" color="text.primary">
        {score}分
      </Typography>
    </Box>
    <LinearProgress
      variant="determinate"
      value={score}
      sx={{
        height: 8,
        borderRadius: 4,
        backgroundColor: `${color}20`,
        '& .MuiLinearProgress-bar': {
          backgroundColor: color,
          borderRadius: 4,
        },
      }}
    />
  </Box>
);

const SpeakingScore = ({ scores }) => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        跟读评分
      </Typography>
      <ScoreItem label="发音准确度" score={scores.pronunciation} color="#2196f3" />
      <ScoreItem label="语调自然度" score={scores.intonation} color="#4caf50" />
      <ScoreItem label="流畅度" score={scores.fluency} color="#ff9800" />
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">
          综合得分
        </Typography>
        <Typography
          variant="h6"
          color="primary"
          sx={{ fontWeight: 'bold' }}
        >
          {Math.round((scores.pronunciation + scores.intonation + scores.fluency) / 3)}
        </Typography>
      </Box>
    </Box>
  );
};

export default SpeakingScore;
