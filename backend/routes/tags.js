import express from 'express';
import { pool, redisClient } from '../server.js';

const router = express.Router();

// 获取所有标签
router.get('/', async (req, res) => {
  try {
    // 尝试从缓存获取
    const cacheKey = 'tags:all';
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const [tags] = await pool.query(
      'SELECT * FROM tags ORDER BY name ASC'
    );

    // 缓存结果
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(tags));

    res.json(tags);
  } catch (error) {
    console.error('获取标签错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取热门标签
router.get('/popular', async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    // 尝试从缓存获取
    const cacheKey = `tags:popular:${limit}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const [tags] = await pool.query(
      'SELECT * FROM tags WHERE usage_count > 0 ORDER BY usage_count DESC, name ASC LIMIT ?',
      [parseInt(limit)]
    );

    // 缓存结果
    await redisClient.setEx(cacheKey, 1800, JSON.stringify(tags));

    res.json(tags);
  } catch (error) {
    console.error('获取热门标签错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;