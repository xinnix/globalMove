import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/init.js';
import { auth, generateToken } from '../middleware/auth.js';
import { promisify } from 'util';

const router = express.Router();

// 将查询操作转换为 Promise
const dbGet = promisify(db.get.bind(db));
const dbRun = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      resolve(this);
    });
  });
};
const dbAll = promisify(db.all.bind(db));

// 用户注册
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    // 检查用户名是否已存在
    const existingUser = await dbGet('SELECT id FROM users WHERE username = ?', [username]);
    
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // 创建新用户
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const result = await dbRun(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashedPassword]
    );

    // 生成 JWT token
    const token = generateToken(result.lastID);
    
    // 验证用户是否真的创建成功
    const newUser = await dbGet('SELECT id, username FROM users WHERE id = ?', [result.lastID]);
    
    if (!newUser) {
      throw new Error('User creation failed');
    }

    res.json({
      message: 'Registration successful',
      token,
      userId: newUser.id,
      username: newUser.username
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// 用户登录
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    // 查找用户
    const user = await dbGet('SELECT * FROM users WHERE username = ?', [username]);

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // 验证密码
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // 生成 token
    const token = generateToken(user.id);

    res.json({
      message: 'Login successful',
      token,
      userId: user.id,
      username: user.username
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// 获取用户信息
router.get('/me', auth, async (req, res) => {
  try {
    const user = await dbGet(
      'SELECT id, username, created_at FROM users WHERE id = ?', 
      [req.user.userId]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Server error' });
  }
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

    await dbRun(
      `UPDATE users SET ${updateQuery} WHERE id = ?`,
      values
    );

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 获取用户活动数据
router.get('/activities', auth, async (req, res) => {
  try {
    // 获取用户的所有活动
    const activities = await dbAll(`
      SELECT 
        a.id,
        a.created_at as date,
        at.name as type,
        n.text as note_text
      FROM activities a
      LEFT JOIN activity_types at ON a.type_id = at.id
      LEFT JOIN notes n ON a.note_id = n.id
      WHERE a.user_id = ?
      ORDER BY a.created_at DESC
    `, [req.user.id]);

    // 获取用户统计数据
    const stats = await dbGet(`
      SELECT 
        (SELECT COUNT(*) FROM notes WHERE user_id = ?) as notes_count,
        (SELECT COUNT(DISTINCT strftime('%Y-%m-%d', created_at)) FROM activities WHERE user_id = ?) as days_count,
        (SELECT COUNT(DISTINCT note_id) FROM activities WHERE user_id = ? AND type_id = 2) as practice_count
    `, [req.user.id, req.user.id, req.user.id]);

    res.json({
      activities,
      stats: {
        notes: stats.notes_count,
        days: stats.days_count,
        tags: stats.practice_count // 这里用练习过的笔记数作为标签数
      }
    });
  } catch (error) {
    console.error('Error getting user activities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
