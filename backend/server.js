import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { createClient } from 'redis';

// 导入路由
import authRoutes from './routes/auth.js';
import snippetRoutes from './routes/snippets.js';
import userRoutes from './routes/users.js';
import tagRoutes from './routes/tags.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5000;

// ==================== 中间件 ====================
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==================== MySQL连接池 ====================
export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'codesnippet_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// 测试MySQL连接
pool.getConnection()
  .then(connection => {
    console.log('✅ MySQL数据库连接成功');
    connection.release();
  })
  .catch(err => {
    console.error('❌ MySQL数据库连接失败:', err.message);
  });

// ==================== Redis客户端 ====================
export const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  }
});

redisClient.on('error', (err) => console.error('Redis错误:', err));
redisClient.on('connect', () => console.log('✅ Redis连接成功'));

await redisClient.connect();

// ==================== WebSocket实时协作 ====================
const activeUsers = new Map(); // 记录在线用户

io.on('connection', (socket) => {
  console.log('🔌 用户连接:', socket.id);

  // 加入代码片段房间
  socket.on('join-snippet', (snippetId) => {
    socket.join(`snippet-${snippetId}`);
    console.log(`用户 ${socket.id} 加入片段 ${snippetId}`);
  });

  // 实时代码编辑
  socket.on('code-change', (data) => {
    const { snippetId, code, language } = data;
    socket.to(`snippet-${snippetId}`).emit('code-update', { code, language, userId: socket.id });
  });

  // 离开房间
  socket.on('leave-snippet', (snippetId) => {
    socket.leave(`snippet-${snippetId}`);
    console.log(`用户 ${socket.id} 离开片段 ${snippetId}`);
  });

  socket.on('disconnect', () => {
    console.log('🔌 用户断开:', socket.id);
  });
});

export { io };

// ==================== API路由 ====================
app.get('/', (req, res) => {
  res.json({
    message: '🚀 CodeSnippet Hub API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      snippets: '/api/snippets',
      users: '/api/users',
      tags: '/api/tags'
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/snippets', snippetRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tags', tagRoutes);

// ==================== 错误处理 ====================
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ 
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.use((req, res) => {
  res.status(404).json({ error: '路径不存在' });
});

// ==================== 启动服务器 ====================
httpServer.listen(PORT, () => {
  console.log(`\n🚀 服务器运行在 http://localhost:${PORT}`);
  console.log(`📡 WebSocket服务已启动`);
  console.log(`🗄️  MySQL: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
  console.log(`💾 Redis: ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}\n`);
});

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('\n正在关闭服务器...');
  await pool.end();
  await redisClient.quit();
  httpServer.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});