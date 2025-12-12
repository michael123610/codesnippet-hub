import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true
};

async function initDatabase() {
  let connection;
  
  try {
    console.log('🔄 开始初始化数据库...\n');
    
    // 连接到MySQL
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ MySQL连接成功');

    // 读取并执行SQL脚本
    const sqlPath = join(__dirname, '..', '..', 'database', 'schema.sql');
    const sql = readFileSync(sqlPath, 'utf8');
    
    await connection.query(sql);
    console.log('✅ 数据库表创建成功');

    // 切换到codesnippet_db数据库
    await connection.query('USE codesnippet_db');

    // 创建测试用户
    const hashedPassword = await bcrypt.hash('demo123', 10);
    
    try {
      await connection.query(
        'INSERT INTO users (username, email, password, bio) VALUES (?, ?, ?, ?)',
        ['demo_user', 'demo@codesnippet.com', hashedPassword, '这是一个测试用户账号']
      );
      console.log('✅ 测试用户创建成功');
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        console.log('ℹ️  测试用户已存在，跳过创建');
      } else {
        throw err;
      }
    }

    // 插入示例代码片段
    try {
      const [users] = await connection.query('SELECT id FROM users WHERE email = ?', ['demo@codesnippet.com']);
      const userId = users[0].id;

      await connection.query(
        `INSERT INTO snippets (user_id, title, description, code, language, is_public) VALUES
        (?, 'JavaScript数组去重', '使用Set实现数组去重的简洁方法', 'const uniqueArray = (arr) => [...new Set(arr)];\n\nconsole.log(uniqueArray([1, 2, 2, 3, 4, 4, 5]));', 'javascript', TRUE),
        (?, 'Python快速排序', '递归实现的快速排序算法', 'def quicksort(arr):\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr) // 2]\n    left = [x for x in arr if x < pivot]\n    middle = [x for x in arr if x == pivot]\n    right = [x for x in arr if x > pivot]\n    return quicksort(left) + middle + quicksort(right)', 'python', TRUE),
        (?, 'React自定义Hook', '用于管理本地存储的Hook', 'import { useState, useEffect } from "react";\n\nfunction useLocalStorage(key, initialValue) {\n  const [value, setValue] = useState(() => {\n    const item = localStorage.getItem(key);\n    return item ? JSON.parse(item) : initialValue;\n  });\n\n  useEffect(() => {\n    localStorage.setItem(key, JSON.stringify(value));\n  }, [key, value]);\n\n  return [value, setValue];\n}', 'javascript', TRUE)`,
        [userId, userId, userId]
      );
      console.log('✅ 示例代码片段创建成功');
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        console.log('ℹ️  示例数据已存在，跳过创建');
      } else {
        console.log('⚠️  创建示例数据失败:', err.message);
      }
    }

    console.log('\n✨ 数据库初始化完成！\n');
    console.log('👤 测试账户信息:');
    console.log('   邮箱: demo@codesnippet.com');
    console.log('   密码: demo123\n');

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDatabase();