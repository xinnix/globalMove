import express from 'express';
import db from '../db/init.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// 创建笔记
router.post('/', auth, (req, res) => {
  const { text } = req.body;
  const userId = req.user.userId;

  db.run(
    'INSERT INTO notes (user_id, text) VALUES (?, ?)',
    [userId, text],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error creating note' });
      }
      res.status(201).json({
        id: this.lastID,
        text,
        userId,
        message: 'Note created successfully'
      });
    }
  );
});

// 获取用户的所有笔记
router.get('/', auth, (req, res) => {
  db.all(
    'SELECT * FROM notes WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.userId],
    (err, notes) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching notes' });
      }
      res.json(notes);
    }
  );
});

// 更新笔记
router.patch('/:id', auth, (req, res) => {
  const { id } = req.params;
  const updates = Object.keys(req.body);
  const allowedUpdates = ['text', 'translated_text', 'audio_url', 'progress'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).json({ error: 'Invalid updates' });
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No updates provided' });
  }

  // 构建更新查询
  const setStatements = updates.map(field => `${field} = ?`);
  setStatements.push('updated_at = ?');
  
  const query = `UPDATE notes SET ${setStatements.join(', ')} WHERE id = ? AND user_id = ?`;
  
  // 构建参数数组
  const values = [
    ...updates.map(field => req.body[field]),
    new Date().toISOString(),
    id,
    req.user.userId
  ];

  // 执行更新
  db.run(query, values, function(err) {
    if (err) {
      console.error('Error updating note:', err);
      return res.status(500).json({ error: 'Error updating note' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Note not found or unauthorized' });
    }
    res.json({ 
      message: 'Note updated successfully',
      updates: req.body
    });
  });
});

// 删除笔记
router.delete('/:id', auth, (req, res) => {
  const { id } = req.params;

  db.run(
    'DELETE FROM notes WHERE id = ? AND user_id = ?',
    [id, req.user.userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error deleting note' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Note not found or unauthorized' });
      }
      res.json({ message: 'Note deleted successfully' });
    }
  );
});

export default router;
