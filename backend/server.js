import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import userRoutes from './routes/users.js';
import noteRoutes from './routes/notes.js';
import practicesRoutes from './routes/practices.js';
import './db/init.js';
import fs from 'fs';
import fetch from 'node-fetch';
import CryptoJS from 'crypto-js';
import { promisify } from 'util';
import say from 'say';
import sqlite3 from 'sqlite3';
import jwt from 'jsonwebtoken'; // <--- Add this line

dotenv.config();

// 设置固定的 JWT 密钥用于测试
process.env.JWT_SECRET = 'your-secret-key';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 5002;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5000', 'http://localhost:5001', 'http://localhost:5002'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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

// Enable pre-flight requests for all routes
app.options('*', cors());

// JWT 验证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Routes
console.log('Setting up routes...');

// 设置静态文件服务
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// API 路由
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/notes', authenticateToken, noteRoutes);
app.use('/api/v1/practices', authenticateToken, practicesRoutes);

// SQLite 连接配置
const db = new sqlite3.Database(join(__dirname, 'db', 'database.sqlite'));

// Promisify database operations
const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
};

// Database setup
db.serialize(() => {
  // First, drop the existing activities table
  db.run('DROP TABLE IF EXISTS activities');

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    text TEXT,
    translated_text TEXT,
    audio_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  db.run(`
    CREATE TABLE IF NOT EXISTS practices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      noteId INTEGER NOT NULL,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      pronunciation INTEGER NOT NULL,
      intonation INTEGER NOT NULL,
      fluency INTEGER NOT NULL,
      audioUrl TEXT,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (noteId) REFERENCES notes(id)
    )
  `);

  console.log('Database tables created successfully');

  // Generate test data
  const generateTestData = async () => {
    try {
      // Insert a test user if not exists
      const testUser = await dbGet('SELECT id FROM users WHERE username = ?', ['testuser']);

      let userId;
      if (!testUser) {
        const result = await dbRun(
          'INSERT INTO users (username, password) VALUES (?, ?)',
          ['testuser', 'testpass']
        );
        userId = result.lastID;
      } else {
        userId = testUser.id;
      }

      // Generate activities for the last 180 days
      const generateActivities = async () => {
        // Clear existing test activities
        await dbRun('DELETE FROM activities WHERE user_id = ?', [userId]);

        // Generate new activities
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 180);

        for (let i = 0; i < 180; i++) {
          const date = new Date(startDate);
          date.setDate(date.getDate() + i);
          
          // Randomly decide if there should be activity on this day
          if (Math.random() > 0.3) { // 70% chance of having activity
            const count = Math.floor(Math.random() * 5) + 1; // 1-5 activities
            const type_id = Math.floor(Math.random() * 3) + 1; // Random type between 1-3
            await dbRun(
              'INSERT INTO activities (user_id, type_id, date, count) VALUES (?, ?, ?, ?)',
              [userId, type_id, date.toISOString().split('T')[0], count]
            );
          }
        }
      };

      await generateActivities();
      console.log('Test data generated successfully');
    } catch (error) {
      console.error('Error generating test data:', error);
      throw error;
    }
  };

  // Run the test data generation
  generateTestData().catch(console.error);
});

// Activities routes
const activitiesRouter = express.Router();

activitiesRouter.get('/', async (req, res) => {
  try {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);

    const activities = await dbAll(
      `SELECT date, COUNT(*) as count 
       FROM activities 
       WHERE user_id = ? AND date >= ? 
       GROUP BY date 
       ORDER BY date DESC`,
      [req.user.id, startDate.toISOString().split('T')[0]]
    );
    res.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

activitiesRouter.post('/', async (req, res) => {
  try {
    const date = new Date().toISOString().split('T')[0];
    
    // Check if there's already an activity for today
    const existingActivity = await dbGet(
      'SELECT * FROM activities WHERE user_id = ? AND date = ?',
      [req.user.id, date]
    );

    if (existingActivity) {
      // Update count for existing activity
      await dbRun(
        'UPDATE activities SET count = count + 1 WHERE user_id = ? AND date = ?',
        [req.user.id, date]
      );
    } else {
      // Create new activity
      await dbRun(
        'INSERT INTO activities (user_id, type_id, date, count) VALUES (?, ?, ?, ?)',
        [req.user.id, 1, date, 1]
      );
    }

    res.status(201).json({ date });
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ error: 'Failed to create activity' });
  }
});

app.use('/api/v1/activities', authenticateToken, activitiesRouter);
console.log('Activities routes configured at /api/v1/activities');

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
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

// 百度翻译 API 函数
async function baiduTranslate(text, from = 'zh', to = 'en') {
  if (!text) {
    throw new Error('Text is required for translation');
  }

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
    console.log('Sending translation request to Baidu API...');
    const response = await fetch(`${url}?${queryString}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Baidu API response:', data);
    
    if (data.error_code) {
      throw new Error(`Baidu API error: ${data.error_msg}`);
    }
    
    if (!data.trans_result || !data.trans_result[0]) {
      throw new Error('Invalid response format from Baidu API');
    }
    
    return data.trans_result[0].dst;
  } catch (error) {
    console.error('Translation error:', error);
    throw new Error(`Translation failed: ${error.message}`);
  }
}

// Translate endpoint
app.post('/api/v1/translate', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
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
    const fileName = `${Date.now()}.wav`;
    const outputFile = join(uploadsDir, fileName);
    
    await new Promise((resolve, reject) => {
      say.export(text, 'Alex', 1.0, outputFile, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
    
    // 返回完整的 URL
    const audioUrl = `http://localhost:${port}/uploads/${fileName}`;
    res.json({ audioUrl });
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取用户练习历史
app.get('/api/practices', authenticateToken, async (req, res) => {
  try {
    const practices = await dbAll(
      `SELECT p.*, n.text, n.translated_text 
       FROM practices p 
       LEFT JOIN notes n ON p.noteId = n.id 
       WHERE p.userId = ? 
       ORDER BY p.date DESC`,
      [req.user.id]
    );
    res.json(practices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 提交跟读练习
app.post('/api/practices', authenticateToken, upload.single('audio'), async (req, res) => {
  try {
    const { noteId } = req.body;
    
    // 这里应该调用语音评分API进行评分
    // 示例评分（实际项目中应该替换为真实的评分API）
    const scores = {
      pronunciation: Math.round(70 + Math.random() * 30),
      intonation: Math.round(70 + Math.random() * 30),
      fluency: Math.round(70 + Math.random() * 30)
    };

    const practice = await dbRun(
      `INSERT INTO practices (userId, noteId, pronunciation, intonation, fluency, audioUrl)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        noteId,
        scores.pronunciation,
        scores.intonation,
        scores.fluency,
        req.file ? `/uploads/${req.file.filename}` : null
      ]
    );

    res.json({ id: practice.lastID });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取用户活动热力图数据
app.get('/api/activities', authenticateToken, async (req, res) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 180); // 获取过去180天的数据

    const activities = await dbAll(
      `SELECT date, COUNT(*) as count 
       FROM activities 
       WHERE user_id = ? AND date >= date(?) 
       GROUP BY date
       ORDER BY date DESC`,
      [req.user.id, startDate.toISOString()]
    );
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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
