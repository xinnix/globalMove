import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import userRoutes from './routes/users.js';
import noteRoutes from './routes/notes.js';
import './db/init.js';
import fs from 'fs';
import fetch from 'node-fetch';
import CryptoJS from 'crypto-js';
import { promisify } from 'util';
import say from 'say';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure file upload
const upload = multer({ dest: 'uploads/' });

// Create uploads directory if it doesn't exist
const uploadsDir = join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Add debug middleware
app.use((req, res, next) => {
  console.log('\n=== Incoming Request ===');
  console.log('Time:', new Date().toISOString());
  console.log('Method:', req.method);
  console.log('Path:', req.path);
  console.log('Query:', req.query);
  console.log('Body:', req.body);
  console.log('Headers:', req.headers);
  console.log('======================\n');
  next();
});

// Routes
console.log('Setting up routes...');

// API Routes
app.use('/api/v1/users', userRoutes);
console.log('User routes configured at /api/v1/users');
app.use('/api/v1/notes', noteRoutes);
console.log('Note routes configured at /api/v1/notes');

// 百度翻译 API 函数
async function baiduTranslate(text, from = 'zh', to = 'en') {
  const salt = Date.now();
  const sign = CryptoJS.MD5(process.env.BAIDU_APPID + text + salt + process.env.BAIDU_KEY).toString();
  
  const url = 'https://fanyi-api.baidu.com/api/trans/vip/translate';
  const params = {
    q: text,
    from,
    to,
    appid: process.env.BAIDU_APPID,
    salt,
    sign
  };
  
  const queryString = Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
  
  try {
    const response = await fetch(`${url}?${queryString}`);
    const data = await response.json();
    return data.trans_result[0].dst;
  } catch (error) {
    console.error('Translation error:', error);
    throw new Error('Translation failed');
  }
}

// Translate endpoint
app.post('/api/v1/translate', async (req, res) => {
  try {
    const { text } = req.body;
    const translatedText = await baiduTranslate(text);
    res.json({ translatedText });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Text-to-Speech endpoint
app.post('/api/v1/tts', async (req, res) => {
  try {
    const { text } = req.body;
    const outputFile = join(uploadsDir, `${Date.now()}.wav`);
    
    await new Promise((resolve, reject) => {
      say.export(text, 'Alex', 1.0, outputFile, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
    
    res.json({ audioUrl: `/uploads/${outputFile}` });
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve static files
app.use('/uploads', express.static(uploadsDir));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('\n=== Error ===');
  console.error('Time:', new Date().toISOString());
  console.error('Error:', err);
  console.error('Stack:', err.stack);
  console.error('=============\n');
  res.status(500).json({ error: 'Something broke!' });
});

// 404 handler - 必须在所有路由之后
app.use((req, res) => {
  console.log('\n=== 404 Not Found ===');
  console.log('Time:', new Date().toISOString());
  console.log('Method:', req.method);
  console.log('Path:', req.path);
  console.log('===================\n');
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log('Available routes:');
  console.log('- POST /api/v1/users/register');
  console.log('- POST /api/v1/users/login');
  console.log('- GET /api/v1/users/me');
  console.log('- POST /api/v1/notes');
  console.log('- GET /api/v1/notes');
  console.log('- POST /api/v1/translate');
  console.log('- POST /api/v1/tts');
});
