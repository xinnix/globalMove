# Global Move

一个帮助用户学习英语的应用程序，支持中文到英文的翻译和文本转语音功能。

## 功能特点

- 用户认证系统（注册、登录）
- 笔记管理（创建、编辑、删除）
- 中英文翻译（使用百度翻译 API）
- 文本转语音（英文）
- 进度跟踪

## 技术栈

### 后端
- Node.js
- Express
- SQLite3
- JWT 认证
- Bcrypt 密码加密

### 前端
- React
- Material-UI
- Axios

## 安装和运行

1. 克隆仓库
```bash
git clone https://github.com/yourusername/globalMove.git
cd globalMove
```

2. 安装依赖
```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

3. 配置环境变量
```bash
# 在 backend 目录创建 .env 文件
BAIDU_APPID=your_baidu_appid
BAIDU_KEY=your_baidu_key
JWT_SECRET=your_jwt_secret
```

4. 运行应用
```bash
# 运行后端（在 backend 目录）
npm start

# 运行前端（在 frontend 目录）
npm start
```

## API 文档

### 用户认证
- POST /api/v1/users/register - 用户注册
- POST /api/v1/users/login - 用户登录
- GET /api/v1/users/me - 获取用户信息

### 笔记管理
- POST /api/v1/notes - 创建笔记
- GET /api/v1/notes - 获取所有笔记
- PATCH /api/v1/notes/:id - 更新笔记
- DELETE /api/v1/notes/:id - 删除笔记

### 翻译和语音
- POST /api/v1/translate - 翻译文本
- POST /api/v1/tts - 文本转语音

## 贡献

欢迎提交 Pull Request 和 Issue。

## 许可证

MIT
