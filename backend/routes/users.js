import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/init.js';
import { auth, generateToken } from '../middleware/auth.js';

const router = express.Router();

// 用户注册
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // 检查用户名和邮箱是否已存在
    db.get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (user) {
        return res.status(400).json({ error: 'Username or email already exists' });
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(password, 10);

      // 创建新用户
      db.run(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hashedPassword],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Error creating user' });
          }

          // 生成 JWT token
          const token = generateToken(this.lastID);
          res.status(201).json({
            message: 'User created successfully',
            token,
            userId: this.lastID
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 用户登录
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    try {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Invalid password' });
      }

      const token = generateToken(user.id);
      res.json({
        message: 'Login successful',
        token,
        userId: user.id,
        username: user.username
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
});

// 获取用户信息
router.get('/me', auth, (req, res) => {
  db.get('SELECT id, username, email, created_at FROM users WHERE id = ?', [req.user.userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  });
});

// 更新用户信息
router.patch('/me', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['username', 'email', 'password'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).json({ error: 'Invalid updates' });
  }

  try {
    if (req.body.password) {
      req.body.password = await bcrypt.hash(req.body.password, 10);
    }

    const updateQuery = updates
      .map(field => `${field} = ?`)
      .join(', ');
    
    const values = updates.map(field => req.body[field]);
    values.push(req.user.userId);

    db.run(
      `UPDATE users SET ${updateQuery} WHERE id = ?`,
      values,
      (err) => {
        if (err) {
          return res.status(500).json({ error: 'Error updating user' });
        }
        res.json({ message: 'User updated successfully' });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
