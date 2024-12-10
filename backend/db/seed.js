import bcrypt from 'bcryptjs';
import db from './init.js';

// 清空现有数据
const clearData = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('DELETE FROM notes', (err) => {
        if (err) reject(err);
      });
      db.run('DELETE FROM users', (err) => {
        if (err) reject(err);
        resolve();
      });
    });
  });
};

// 创建测试用户
const createTestUsers = async () => {
  const users = [
    {
      username: 'testuser1',
      email: 'test1@example.com',
      password: await bcrypt.hash('password123', 10)
    },
    {
      username: 'testuser2',
      email: 'test2@example.com',
      password: await bcrypt.hash('password123', 10)
    }
  ];

  return new Promise((resolve, reject) => {
    const stmt = db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)');
    
    db.serialize(() => {
      users.forEach(user => {
        stmt.run([user.username, user.email, user.password], (err) => {
          if (err) reject(err);
        });
      });
      
      stmt.finalize((err) => {
        if (err) reject(err);
        resolve();
      });
    });
  });
};

// 创建测试笔记
const createTestNotes = () => {
  return new Promise((resolve, reject) => {
    // 首先获取用户ID
    db.all('SELECT id FROM users', (err, users) => {
      if (err) {
        reject(err);
        return;
      }

      const notes = [
        {
          user_id: users[0].id,
          text: '今天天气真好',
          translated_text: 'The weather is nice today',
          progress: 1
        },
        {
          user_id: users[0].id,
          text: '我正在学习英语',
          translated_text: 'I am learning English',
          progress: 2
        },
        {
          user_id: users[1].id,
          text: '这是一个测试笔记',
          translated_text: 'This is a test note',
          progress: 1
        }
      ];

      const stmt = db.prepare(
        'INSERT INTO notes (user_id, text, translated_text, progress) VALUES (?, ?, ?, ?)'
      );

      db.serialize(() => {
        notes.forEach(note => {
          stmt.run(
            [note.user_id, note.text, note.translated_text, note.progress],
            (err) => {
              if (err) reject(err);
            }
          );
        });

        stmt.finalize((err) => {
          if (err) reject(err);
          resolve();
        });
      });
    });
  });
};

// 运行种子脚本
const runSeed = async () => {
  try {
    console.log('清空现有数据...');
    await clearData();

    console.log('创建测试用户...');
    await createTestUsers();

    console.log('创建测试笔记...');
    await createTestNotes();

    console.log('数据初始化完成！');
    console.log('\n测试账户:');
    console.log('1. email: test1@example.com, password: password123');
    console.log('2. email: test2@example.com, password: password123');

    process.exit(0);
  } catch (error) {
    console.error('初始化数据时出错:', error);
    process.exit(1);
  }
};

runSeed();
