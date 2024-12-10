import express from 'express';
import db from '../db/init.js';
import { auth } from '../middleware/auth.js';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configure multer for audio file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// 创建练习记录
router.post('/', auth, upload.single('audio'), async (req, res) => {
  try {
    const { noteId } = req.body;
    const audioUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const result = await db.run(
      'INSERT INTO practices (user_id, note_id, audio_url) VALUES (?, ?, ?)',
      [req.user.userId, noteId, audioUrl]
    );

    // 更新活动记录
    const date = new Date().toISOString().split('T')[0];
    await db.run(
      `INSERT INTO activities (user_id, type_id, date, count)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, type_id, date) 
       DO UPDATE SET count = count + 1
       WHERE user_id = ? AND type_id = ? AND date = ?`,
      [req.user.userId, 2, date, 1, req.user.userId, 2, date]
    );

    res.status(201).json({
      id: result.lastID,
      noteId,
      audioUrl,
      message: 'Practice recorded successfully'
    });
  } catch (error) {
    console.error('Error creating practice:', error);
    res.status(500).json({ error: 'Failed to create practice record' });
  }
});

// 获取用户的所有练习记录
router.get('/', auth, async (req, res) => {
  try {
    const practices = await db.all(
      `SELECT p.*, n.text, n.translated_text 
       FROM practices p 
       LEFT JOIN notes n ON p.note_id = n.id 
       WHERE p.user_id = ? 
       ORDER BY p.created_at DESC`,
      [req.user.userId]
    );
    res.json(practices);
  } catch (error) {
    console.error('Error fetching practices:', error);
    res.status(500).json({ error: 'Failed to fetch practices' });
  }
});

export default router;
