const express = require('express');
const router = express.Router();
const { CanteenOrder } = require('../db');

// 获取所有订单（Web端）
router.get('/canteen/orders', async (req, res) => {
  try {
    const orders = await CanteenOrder.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.send({ code: 0, data: orders });
  } catch (err) {
    res.send({ code: -1, error: err.toString() });
  }
});

// 获取我的订单（小程序端）
router.get('/canteen/orders/my', async (req, res) => {
  const openid = req.headers['x-wx-openid'];
  if (!openid) {
    res.send({ code: -1, error: '未登录' });
    return;
  }
  try {
    const orders = await CanteenOrder.findAll({
      where: { openid },
      order: [['createdAt', 'DESC']]
    });
    res.send({ code: 0, data: orders });
  } catch (err) {
    res.send({ code: -1, error: err.toString() });
  }
});

// 创建订单（小程序端）
router.post('/canteen/orders', async (req, res) => {
  const openid = req.headers['x-wx-openid'];
  if (!openid) {
    res.send({ code: -1, error: '未登录' });
    return;
  }
  
  // items: [{id, name, count, price}]
  const { name, phone, diningTime, items, remark, totalPrice } = req.body;
  
  if (!name || !phone || !diningTime || !items || items.length === 0) {
    res.send({ code: -1, error: '缺少必填字段' });
    return;
  }

  // Generate simple dish summary string
  const dishSummary = items.map(i => `${i.name} x${i.count}`).join(', ');

  try {
    const order = await CanteenOrder.create({
      openid,
      name,
      dish: dishSummary,
      items: JSON.stringify(items),
      diningTime,
      phone,
      remark,
      totalPrice: totalPrice || 0,
      status: 'pending'
    });
    res.send({ code: 0, data: order });
  } catch (err) {
    res.send({ code: -1, error: err.toString() });
  }
});

// 更新订单状态（Web端）
router.post('/canteen/orders/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  try {
    const order = await CanteenOrder.findByPk(id);
    if (!order) {
      res.send({ code: -1, error: '订单不存在' });
      return;
    }
    
    order.status = status;
    await order.save();
    
    res.send({ code: 0, data: order });
  } catch (err) {
    res.send({ code: -1, error: err.toString() });
  }
});

// 删除订单
router.delete('/canteen/orders/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await CanteenOrder.destroy({ where: { id } });
    res.send({ code: 0, data: 'deleted' });
  } catch (err) {
    res.send({ code: -1, error: err.toString() });
  }
});

module.exports = router;
