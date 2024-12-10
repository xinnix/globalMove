import React, { useState, useEffect } from 'react';
import { Typography } from '@mui/material';

const HighlightedText = ({ text, isPlaying, currentTime, audioRef }) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const words = text.split(' ');
  
  // 估算每个单词的时间点（简单平均分配）
  const wordTimings = words.map((_, index) => ({
    word: words[index],
    start: (index / words.length) * (audioRef?.duration || 0),
    end: ((index + 1) / words.length) * (audioRef?.duration || 0)
  }));

  useEffect(() => {
    if (!isPlaying) {
      setCurrentWordIndex(-1);
      return;
    }

    const updateHighlight = () => {
      const currentTime = audioRef?.currentTime || 0;
      const newIndex = wordTimings.findIndex(
        timing => currentTime >= timing.start && currentTime < timing.end
      );
      setCurrentWordIndex(newIndex);
    };

    const interval = setInterval(updateHighlight, 50);
    return () => clearInterval(interval);
  }, [isPlaying, audioRef, wordTimings]);

  return (
    <Typography variant="body1">
      {words.map((word, index) => (
        <span
          key={index}
          style={{
            backgroundColor: index === currentWordIndex ? '#e3f2fd' : 'transparent',
            padding: '2px 4px',
            margin: '0 2px',
            borderRadius: '4px',
            transition: 'background-color 0.2s'
          }}
        >
          {word}
        </span>
      ))}
    </Typography>
  );
};

export default HighlightedText;
