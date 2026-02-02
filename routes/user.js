const express = require('express');
const router = express.Router();
const { User } = require('../db');

// 更新或创建用户信息
router.post('/user/update', async (req, res) => {
  const openid = req.headers['x-wx-openid'];
  if (!openid) {
    return res.send({ code: 401, error: '未登录' });
  }

  const { nickname, avatarUrl, studentId, department } = req.body;
  
  try {
    let user = await User.findOne({ where: { openid } });
    if (user) {
      // 更新
      if (nickname) user.nickname = nickname;
      if (avatarUrl) user.avatarUrl = avatarUrl;
      if (studentId) user.studentId = studentId;
      if (department) user.department = department;
      await user.save();
    } else {
      // 创建
      user = await User.create({
        openid,
        nickname: nickname || '微信用户',
        avatarUrl: avatarUrl || '',
        studentId,
        department
      });
    }
    res.send({ code: 0, data: user });
  } catch (err) {
    console.error(err);
    res.send({ code: 500, error: '更新用户信息失败' });
  }
});

// 获取用户信息
router.get('/user/profile', async (req, res) => {
  const openid = req.headers['x-wx-openid'];
  if (!openid) {
    return res.send({ code: 401, error: '未登录' });
  }

  try {
    const user = await User.findOne({ where: { openid } });
    if (user) {
      res.send({ code: 0, data: user });
    } else {
      res.send({ code: 404, error: '用户未注册' });
    }
  } catch (err) {
    console.error(err);
    res.send({ code: 500, error: '获取用户信息失败' });
  }
});

module.exports = router;
