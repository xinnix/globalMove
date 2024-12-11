import React, { useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';

const WaveformDisplay = ({ duration, currentTime, isPlaying }) => {
  const canvasRef = useRef(null);
  const requestRef = useRef();
  const startTimeRef = useRef(Date.now());

  // 生成随机波形数据
  const generateWaveformData = () => {
    const numPoints = 100;
    const data = [];
    let prevY = 0.5;
    
    for (let i = 0; i < numPoints; i++) {
      // 使用正弦波作为基础
      const base = Math.sin(i * 0.1) * 0.3 + 0.5;
      
      // 添加随机变化，但确保与前一个点的连续性
      const randomVariation = (Math.random() - 0.5) * 0.2;
      const y = Math.max(0.1, Math.min(0.9, (base + prevY + randomVariation) / 2));
      
      data.push(y);
      prevY = y;
    }
    
    return data;
  };

  useEffect(() => {
    const waveformData = generateWaveformData();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    // 设置画布大小
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const animate = () => {
      const progress = isPlaying ? (Date.now() - startTimeRef.current) / 1000 : currentTime;
      const normalizedProgress = Math.min(progress / duration, 1);

      // 清除画布
      ctx.clearRect(0, 0, width, height);

      // 绘制背景
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, width, height);

      // 绘制进度条背景
      ctx.fillStyle = '#e0e0e0';
      ctx.fillRect(0, 0, width * normalizedProgress, height);

      // 绘制波形
      const barWidth = width / waveformData.length;
      const barGap = 1;
      const effectiveBarWidth = barWidth - barGap;

      waveformData.forEach((value, index) => {
        const x = index * barWidth;
        const barHeight = value * height;
        const y = (height - barHeight) / 2;

        // 判断是否在播放进度之前
        const isBeforeProgress = x <= width * normalizedProgress;
        
        // 设置渐变色
        const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
        if (isBeforeProgress) {
          gradient.addColorStop(0, '#2196F3');  // 蓝色顶部
          gradient.addColorStop(1, '#64B5F6');  // 较浅的蓝色底部
        } else {
          gradient.addColorStop(0, '#9E9E9E');  // 灰色顶部
          gradient.addColorStop(1, '#BDBDBD');  // 较浅的灰色底部
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, effectiveBarWidth, barHeight);
      });

      // 如果正在播放，继续动画
      if (isPlaying) {
        requestRef.current = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [duration, currentTime, isPlaying]);

  // 格式化时间
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <Box sx={{ 
      width: '100%',
      position: 'relative',
      bgcolor: 'background.paper',
      borderRadius: 1,
      overflow: 'hidden'
    }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '64px',
          display: 'block'
        }}
      />
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        px: 1,
        mt: 0.5
      }}>
        <Typography variant="caption" color="text.secondary">
          {formatTime(currentTime)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          -{formatTime(duration - currentTime)}
        </Typography>
      </Box>
    </Box>
  );
};

export default WaveformDisplay;
