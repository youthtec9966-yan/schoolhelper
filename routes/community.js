const express = require('express');
const router = express.Router();
const { Post, News, Club, Activity } = require('../db');

// --- 资讯 (News) ---
router.get('/news', async (req, res) => {
  const list = await News.findAll({ order: [['publishDate', 'DESC']] });
  res.send({ code: 0, data: list });
});

// --- 社团 (Club) ---
router.get('/clubs', async (req, res) => {
  const list = await Club.findAll();
  res.send({ code: 0, data: list });
});

// --- 活动 (Activity) ---
router.get('/activities', async (req, res) => {
  const list = await Activity.findAll({ order: [['startTime', 'ASC']] });
  res.send({ code: 0, data: list });
});

// --- 帖子 (Post) - 包含论坛、二手、失物 ---
// 获取帖子列表 (仅展示审核通过的)
router.get('/posts', async (req, res) => {
  const { type } = req.query; // type: forum, second_hand, lost_found
  const where = { status: 1 }; // 默认只查审核通过的
  if (type) where.type = type;
  
  const list = await Post.findAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: 50
  });
  res.send({ code: 0, data: list });
});

// --- 管理端接口 ---

// 获取待审核帖子
router.get('/admin/posts', async (req, res) => {
  const list = await Post.findAll({
    where: { status: 0 },
    order: [['createdAt', 'ASC']]
  });
  res.send({ code: 0, data: list });
});

// 审核帖子
router.post('/admin/posts/:id/audit', async (req, res) => {
  const { status } = req.body; // 1: 通过, 2: 拒绝
  const post = await Post.findByPk(req.params.id);
  if (post) {
    post.status = status;
    await post.save();
    res.send({ code: 0, data: post });
  } else {
    res.send({ code: 404, error: '帖子不存在' });
  }
});

// 发布帖子
router.post('/posts', async (req, res) => {
  const openid = req.headers['x-wx-openid'];
  if (!openid) {
    return res.send({ code: 401, error: '未登录' });
  }

  const { type, title, content, images, price, contact, userInfo } = req.body;
  
  try {
    const post = await Post.create({
      type,
      title,
      content,
      images,
      price,
      contact,
      authorId: openid,
      authorName: userInfo?.nickName || '匿名用户',
      authorAvatar: userInfo?.avatarUrl || ''
    });
    res.send({ code: 0, data: post });
  } catch (err) {
    console.error(err);
    res.send({ code: 500, error: '发布失败' });
  }
});

// 帖子详情
router.get('/posts/:id', async (req, res) => {
  const post = await Post.findByPk(req.params.id);
  if (post) {
    // 增加阅读量
    post.viewCount += 1;
    await post.save();
    res.send({ code: 0, data: post });
  } else {
    res.send({ code: 404, error: '帖子不存在' });
  }
});

module.exports = router;
