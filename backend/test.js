import fetch from 'node-fetch';

const API_URL = 'http://localhost:3001/api';
let authToken = '';

async function testAuth() {
  try {
    // 1. 测试注册
    console.log('\n=== 测试用户注册 ===');
    const registerRes = await fetch(`${API_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      })
    });
    const registerData = await registerRes.json();
    console.log('注册结果:', registerData);

    // 2. 测试登录
    console.log('\n=== 测试用户登录 ===');
    const loginRes = await fetch(`${API_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    const loginData = await loginRes.json();
    console.log('登录结果:', loginData);
    authToken = loginData.token;

    // 3. 测试获取用户信息
    console.log('\n=== 测试获取用户信息 ===');
    const profileRes = await fetch(`${API_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    const profileData = await profileRes.json();
    console.log('用户信息:', profileData);

    // 4. 测试创建笔记
    console.log('\n=== 测试创建笔记 ===');
    const noteRes = await fetch(`${API_URL}/notes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: '这是一个测试笔记',
        translatedText: 'This is a test note'
      })
    });
    const noteData = await noteRes.json();
    console.log('笔记创建结果:', noteData);

    // 5. 测试获取笔记列表
    console.log('\n=== 测试获取笔记列表 ===');
    const notesRes = await fetch(`${API_URL}/notes`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    const notesData = await notesRes.json();
    console.log('笔记列表:', notesData);

  } catch (error) {
    console.error('测试过程中出现错误:', error);
  }
}

testAuth();
