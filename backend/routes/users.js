import express from 'express';
import { pool } from '../server.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 获取用户信息
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await pool.query(
      'SELECT id, username, avatar, bio, github_url, created_at FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 获取用户统计
    const [snippetsCount] = await pool.query(
      'SELECT COUNT(*) as count FROM snippets WHERE user_id = ? AND is_public = TRUE',
      [id]
    );

    const [likesCount] = await pool.query(
      'SELECT COUNT(*) as count FROM likes l JOIN snippets s ON l.snippet_id = s.id WHERE s.user_id = ?',
      [id]
    );

    res.json({
      ...users[0],
      stats: {
        snippetsCount: snippetsCount[0].count,
        likesReceived: likesCount[0].count
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取用户的代码片段
router.get('/:id/snippets', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;

    const [snippets] = await pool.query(
      `SELECT s.*, u.username, u.avatar,
        (SELECT COUNT(*) FROM likes WHERE snippet_id = s.id) as likes_count
      FROM snippets s
      JOIN users u ON s.user_id = u.id
      WHERE s.user_id = ? AND s.is_public = TRUE
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?`,
      [id, parseInt(limit), parseInt(offset)]
    );

    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM snippets WHERE user_id = ? AND is_public = TRUE',
      [id]
    );

    res.json({
      snippets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('获取用户代码片段错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取我的代码片段（包括私有）
router.get('/me/snippets', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;

    const [snippets] = await pool.query(
      `SELECT s.*, 
        (SELECT COUNT(*) FROM likes WHERE snippet_id = s.id) as likes_count,
        (SELECT COUNT(*) FROM favorites WHERE snippet_id = s.id) as favorites_count
      FROM snippets s
      WHERE s.user_id = ?
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?`,
      [req.user.id, parseInt(limit), parseInt(offset)]
    );

    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM snippets WHERE user_id = ?',
      [req.user.id]
    );

    res.json({
      snippets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('获取我的代码片段错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取我的收藏
router.get('/me/favorites', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;

    const [snippets] = await pool.query(
      `SELECT s.*, u.username, u.avatar,
        (SELECT COUNT(*) FROM likes WHERE snippet_id = s.id) as likes_count,
        f.created_at as favorited_at
      FROM favorites f
      JOIN snippets s ON f.snippet_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?`,
      [req.user.id, parseInt(limit), parseInt(offset)]
    );

    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM favorites WHERE user_id = ?',
      [req.user.id]
    );

    res.json({
      snippets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('获取收藏错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;