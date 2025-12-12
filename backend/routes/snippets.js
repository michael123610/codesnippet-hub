import express from 'express';
import { body, validationResult } from 'express-validator';
import { pool, redisClient } from '../server.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();
const CACHE_TTL = parseInt(process.env.CACHE_TTL) || 3600;

// 获取代码片段列表
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 12, search = '', language = '', tag = '' } = req.query;
    const offset = (page - 1) * limit;

    // 构建缓存key
    const cacheKey = `snippets:list:${page}:${limit}:${search}:${language}:${tag}`;
    
    // 尝试从redis获取
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    let query = `
      SELECT s.*, u.username, u.avatar,
        (SELECT COUNT(*) FROM likes WHERE snippet_id = s.id) as likes_count,
        (SELECT GROUP_CONCAT(t.name) FROM snippet_tags st 
         JOIN tags t ON st.tag_id = t.id WHERE st.snippet_id = s.id) as tags
      FROM snippets s
      JOIN users u ON s.user_id = u.id
      WHERE s.is_public = TRUE
    `;

    const params = [];

    if (search) {
      query += ' AND (s.title LIKE ? OR s.description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (language) {
      query += ' AND s.language = ?';
      params.push(language);
    }

    if (tag) {
      query += ` AND s.id IN (
        SELECT snippet_id FROM snippet_tags st
        JOIN tags t ON st.tag_id = t.id
        WHERE t.name = ?
      )`;
      params.push(tag);
    }

    query += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [snippets] = await pool.query(query, params);

    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM snippets s WHERE s.is_public = TRUE';
    const countParams = [];

    if (search) {
      countQuery += ' AND (s.title LIKE ? OR s.description LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm);
    }

    if (language) {
      countQuery += ' AND s.language = ?';
      countParams.push(language);
    }

    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0].total;

    const result = {
      snippets: snippets.map(s => ({
        ...s,
        tags: s.tags ? s.tags.split(',') : []
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };

    // 缓存结果
    await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(result));

    res.json(result);
  } catch (error) {
    console.error('获取代码片段列表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取单个代码片段
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // 尝试从缓存获取
    const cacheKey = `snippet:${id}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      // 更新浏览次数（异步）
      pool.query('UPDATE snippets SET views = views + 1 WHERE id = ?', [id]).catch(console.error);
      return res.json(JSON.parse(cached));
    }

    const [snippets] = await pool.query(
      `SELECT s.*, u.username, u.avatar, u.bio,
        (SELECT COUNT(*) FROM likes WHERE snippet_id = s.id) as likes_count,
        (SELECT GROUP_CONCAT(t.name) FROM snippet_tags st 
         JOIN tags t ON st.tag_id = t.id WHERE st.snippet_id = s.id) as tags
      FROM snippets s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?`,
      [id]
    );

    if (snippets.length === 0) {
      return res.status(404).json({ error: '代码片段不存在' });
    }

    const snippet = snippets[0];

    // 检查是否点赞/收藏
    if (req.user) {
      const [liked] = await pool.query(
        'SELECT id FROM likes WHERE user_id = ? AND snippet_id = ?',
        [req.user.id, id]
      );
      const [favorited] = await pool.query(
        'SELECT id FROM favorites WHERE user_id = ? AND snippet_id = ?',
        [req.user.id, id]
      );
      snippet.isLiked = liked.length > 0;
      snippet.isFavorited = favorited.length > 0;
    }

    snippet.tags = snippet.tags ? snippet.tags.split(',') : [];

    // 缓存结果
    await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(snippet));

    // 更新浏览次数
    await pool.query('UPDATE snippets SET views = views + 1 WHERE id = ?', [id]);

    res.json(snippet);
  } catch (error) {
    console.error('获取代码片段错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 创建代码片段
router.post('/',
  authenticateToken,
  [
    body('title').trim().isLength({ min: 1, max: 200 }).withMessage('标题长度1-200位'),
    body('code').notEmpty().withMessage('代码内容不能为空'),
    body('language').notEmpty().withMessage('请选择编程语言')
  ],
  async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const { title, description, code, language, isPublic = true, tags = [] } = req.body;

      await connection.beginTransaction();

      // 创建代码片段
      const [result] = await connection.query(
        'INSERT INTO snippets (user_id, title, description, code, language, is_public) VALUES (?, ?, ?, ?, ?, ?)',
        [req.user.id, title, description, code, language, isPublic]
      );

      const snippetId = result.insertId;

      // 处理标签
      if (tags && tags.length > 0) {
        for (const tagName of tags) {
          // 查找或创建标签
          let [tagResult] = await connection.query('SELECT id FROM tags WHERE name = ?', [tagName]);
          let tagId;

          if (tagResult.length === 0) {
            const [newTag] = await connection.query('INSERT INTO tags (name) VALUES (?)', [tagName]);
            tagId = newTag.insertId;
          } else {
            tagId = tagResult[0].id;
          }

          // 关联标签
          await connection.query('INSERT INTO snippet_tags (snippet_id, tag_id) VALUES (?, ?)', [snippetId, tagId]);
          await connection.query('UPDATE tags SET usage_count = usage_count + 1 WHERE id = ?', [tagId]);
        }
      }

      await connection.commit();

      // 清除相关缓存
      await redisClient.del('snippets:list:*');

      res.status(201).json({ 
        message: '代码片段创建成功',
        snippetId
      });
    } catch (error) {
      await connection.rollback();
      console.error('创建代码片段错误:', error);
      res.status(500).json({ error: '服务器错误' });
    } finally {
      connection.release();
    }
  }
);

// 点赞/取消点赞
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query(
      'SELECT id FROM likes WHERE user_id = ? AND snippet_id = ?',
      [req.user.id, id]
    );

    if (existing.length > 0) {
      // 取消点赞
      await pool.query('DELETE FROM likes WHERE user_id = ? AND snippet_id = ?', [req.user.id, id]);
      await redisClient.del(`snippet:${id}`);
      return res.json({ message: '已取消点赞', liked: false });
    } else {
      // 点赞
      await pool.query('INSERT INTO likes (user_id, snippet_id) VALUES (?, ?)', [req.user.id, id]);
      await redisClient.del(`snippet:${id}`);
      return res.json({ message: '点赞成功', liked: true });
    }
  } catch (error) {
    console.error('点赞错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 收藏/取消收藏
router.post('/:id/favorite', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query(
      'SELECT id FROM favorites WHERE user_id = ? AND snippet_id = ?',
      [req.user.id, id]
    );

    if (existing.length > 0) {
      await pool.query('DELETE FROM favorites WHERE user_id = ? AND snippet_id = ?', [req.user.id, id]);
      return res.json({ message: '已取消收藏', favorited: false });
    } else {
      await pool.query('INSERT INTO favorites (user_id, snippet_id) VALUES (?, ?)', [req.user.id, id]);
      return res.json({ message: '收藏成功', favorited: true });
    }
  } catch (error) {
    console.error('收藏错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除代码片段
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // 检查权限
    const [snippets] = await pool.query('SELECT user_id FROM snippets WHERE id = ?', [id]);
    if (snippets.length === 0) {
      return res.status(404).json({ error: '代码片段不存在' });
    }

    if (snippets[0].user_id !== req.user.id) {
      return res.status(403).json({ error: '无权删除' });
    }

    await pool.query('DELETE FROM snippets WHERE id = ?', [id]);
    await redisClient.del(`snippet:${id}`);
    await redisClient.del('snippets:list:*');

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除代码片段错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;