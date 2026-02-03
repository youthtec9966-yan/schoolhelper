const express = require('express');
const router = express.Router();
const { Post, News, Club, Activity, Carousel, Comment, PostLike } = require('../db');

// --- 轮播图 (Carousel) ---
router.get('/carousels', async (req, res) => {
  const list = await Carousel.findAll({ order: [['weight', 'DESC'], ['createdAt', 'DESC']] });
  res.send({ code: 0, data: list });
});

// --- 资讯 (News) ---
router.get('/news', async (req, res) => {
  const list = await News.findAll({ order: [['publishDate', 'DESC']] });
  res.send({ code: 0, data: list });
});

router.get('/news/:id', async (req, res) => {
  try {
    const news = await News.findByPk(req.params.id);
    if (news) {
      // 增加阅读量 (可选)
      news.readCount = (news.readCount || 0) + 1;
      await news.save();
      res.send({ code: 0, data: news });
    } else {
      res.send({ code: 404, error: 'News not found' });
    }
  } catch (err) {
    res.send({ code: 500, error: 'Failed to fetch news' });
  }
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
  const { type, category, authorId } = req.query; // type: forum, second_hand, lost_found
  const where = {};
  
  // 如果指定了 authorId，则查询该用户的所有帖子（包括待审核等）；否则只查审核通过的
  if (authorId) {
    where.authorId = authorId;
  } else {
    where.status = 1;
  }

  if (type) where.type = type;
  if (category) where.category = category;
  
  const list = await Post.findAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: 50
  });
  res.send({ code: 0, data: list });
});

// 获取帖子详情
router.get('/posts/:id', async (req, res) => {
  try {
    const { userId } = req.query;
    const post = await Post.findByPk(req.params.id);
    if (post) {
      // 增加浏览量
      post.viewCount = (post.viewCount || 0) + 1;
      await post.save();

      const postData = post.toJSON();
      
      // 获取评论数
      postData.commentCount = await Comment.count({ where: { postId: post.id } });
      
      // 检查是否点赞
      if (userId) {
        const like = await PostLike.findOne({ where: { postId: post.id, userId } });
        postData.isLiked = !!like;
      } else {
        postData.isLiked = false;
      }

      res.send({ code: 0, data: postData });
    } else {
      res.send({ code: 404, error: 'Post not found' });
    }
  } catch (err) {
    console.error(err);
    res.send({ code: 500, error: 'Failed to fetch post' });
  }
});

// 获取评论列表
router.get('/posts/:id/comments', async (req, res) => {
  try {
    const comments = await Comment.findAll({
      where: { postId: req.params.id },
      order: [['createdAt', 'DESC']]
    });
    res.send({ code: 0, data: comments });
  } catch (err) {
    res.send({ code: 500, error: 'Failed to fetch comments' });
  }
});

// 发表评论
router.post('/posts/:id/comments', async (req, res) => {
  try {
    const { content, authorId, authorName, authorAvatar } = req.body;
    const comment = await Comment.create({
      postId: req.params.id,
      content,
      authorId,
      authorName,
      authorAvatar
    });
    res.send({ code: 0, data: comment });
  } catch (err) {
    res.send({ code: 500, error: 'Failed to create comment' });
  }
});

// 点赞/取消点赞
router.post('/posts/:id/like', async (req, res) => {
  try {
    const { userId } = req.body;
    const postId = req.params.id;
    
    const existingLike = await PostLike.findOne({ where: { postId, userId } });
    const post = await Post.findByPk(postId);
    
    if (!post) {
      return res.send({ code: 404, error: 'Post not found' });
    }

    if (existingLike) {
      // 取消点赞
      await existingLike.destroy();
      post.likeCount = Math.max(0, (post.likeCount || 0) - 1);
    } else {
      // 点赞
      await PostLike.create({ postId, userId });
      post.likeCount = (post.likeCount || 0) + 1;
    }
    
    await post.save();
    res.send({ code: 0, data: { likeCount: post.likeCount, isLiked: !existingLike } });
  } catch (err) {
    res.send({ code: 500, error: 'Failed to toggle like' });
  }
});

// --- 管理端接口 ---

// 1. 轮播图管理
router.post('/admin/carousels', async (req, res) => {
  const { imageUrl, link, weight, title } = req.body;
  try {
    const carousel = await Carousel.create({ imageUrl, link, weight, title });
    res.send({ code: 0, data: carousel });
  } catch (err) {
    res.send({ code: 500, error: '创建轮播图失败' });
  }
});

router.delete('/admin/carousels/:id', async (req, res) => {
  try {
    await Carousel.destroy({ where: { id: req.params.id } });
    res.send({ code: 0 });
  } catch (err) {
    res.send({ code: 500, error: '删除轮播图失败' });
  }
});

// 2. 资讯/公告管理
router.get('/admin/news', async (req, res) => {
  const list = await News.findAll({ order: [['publishDate', 'DESC']] });
  res.send({ code: 0, data: list });
});

router.post('/admin/news', async (req, res) => {
  const { type, title, summary, content, cover } = req.body;
  try {
    const news = await News.create({ type, title, summary, content, cover });
    res.send({ code: 0, data: news });
  } catch (err) {
    res.send({ code: 500, error: '发布资讯失败' });
  }
});

router.delete('/admin/news/:id', async (req, res) => {
  try {
    await News.destroy({ where: { id: req.params.id } });
    res.send({ code: 0 });
  } catch (err) {
    res.send({ code: 500, error: '删除资讯失败' });
  }
});

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

  const { type, category, title, content, images, price, contact, userInfo } = req.body;
  
  try {
    const post = await Post.create({
      type,
      category,
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
