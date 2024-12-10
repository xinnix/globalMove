import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Box, IconButton } from '@mui/material';
import { PlayArrow, Pause } from '@mui/icons-material';

const WaveformDisplay = ({ audioUrl, onPlayStateChange, onTimeUpdate }) => {
  const waveformRef = useRef(null);
  const wavesurferRef = useRef(null);
  const [isWaveformPlaying, setIsWaveformPlaying] = useState(false);

  useEffect(() => {
    let isComponentMounted = true;

    const initWaveSurfer = async () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }

      if (!audioUrl || !waveformRef.current || !isComponentMounted) return;

      try {
        const wavesurfer = WaveSurfer.create({
          container: waveformRef.current,
          waveColor: '#4a9eff',
          progressColor: '#1976d2',
          cursorColor: '#1976d2',
          height: 80,
          normalize: true,
          responsive: true,
          barWidth: 2,
          barGap: 1,
          interact: true,
          hideScrollbar: true,
          backend: 'WebAudio',
          barRadius: 3,
          plugins: [],
          mediaControls: true,
          minPxPerSec: 50,
        });

        wavesurfer.on('error', error => {
          console.error('WaveSurfer error:', error);
        });

        wavesurfer.on('ready', () => {
          if (!isComponentMounted) {
            wavesurfer.destroy();
            return;
          }
          console.log('WaveSurfer is ready');
          // 重置播放位置
          wavesurfer.seekTo(0);
        });

        wavesurfer.on('play', () => {
          setIsWaveformPlaying(true);
          onPlayStateChange?.(true);
        });

        wavesurfer.on('pause', () => {
          setIsWaveformPlaying(false);
          onPlayStateChange?.(false);
        });

        wavesurfer.on('finish', () => {
          setIsWaveformPlaying(false);
          onPlayStateChange?.(false);
          if (wavesurferRef.current) {
            wavesurferRef.current.seekTo(0);
          }
        });

        wavesurfer.on('audioprocess', currentTime => {
          if (isComponentMounted) {
            onTimeUpdate?.(currentTime);
          }
        });

        wavesurfer.on('seek', () => {
          if (isComponentMounted) {
            const currentTime = wavesurfer.getCurrentTime();
            onTimeUpdate?.(currentTime);
          }
        });

        await wavesurfer.load(audioUrl);

        if (isComponentMounted) {
          wavesurferRef.current = wavesurfer;
        } else {
          wavesurfer.destroy();
        }
      } catch (error) {
        console.error('Error initializing WaveSurfer:', error);
      }
    };

    initWaveSurfer();

    return () => {
      isComponentMounted = false;
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
    };
  }, [audioUrl, onPlayStateChange, onTimeUpdate]);

  const togglePlayPause = () => {
    if (wavesurferRef.current) {
      if (isWaveformPlaying) {
        wavesurferRef.current.pause();
      } else {
        wavesurferRef.current.play();
      }
    }
  };

  return (
    <Box sx={{ width: '100%', mt: 2, mb: 2 }}>
      <Box
        ref={waveformRef}
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          borderRadius: 2,
          p: 2,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          '& wave': {
            borderRadius: '8px !important',
            overflow: 'hidden',
          },
        }}
      />
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        mt: 2,
        gap: 2 
      }}>
        <IconButton 
          onClick={togglePlayPause} 
          sx={{
            color: '#1976d2',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              color: '#1565c0',
            },
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          {isWaveformPlaying ? <Pause /> : <PlayArrow />}
        </IconButton>
      </Box>
    </Box>
  );
};

export default WaveformDisplay;
