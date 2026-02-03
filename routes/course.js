const express = require('express');
const router = express.Router();
const { Course } = require('../db');

// 获取所有课程
router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.findAll();
    res.send({
      code: 0,
      data: courses,
    });
  } catch (err) {
    res.send({
      code: -1,
      error: err.toString(),
    });
  }
});

// 添加课程
router.post('/courses', async (req, res) => {
  try {
    const { name, teacher, location, dayOfWeek, startTime, endTime, weeks, color } = req.body;
    const course = await Course.create({
      name,
      teacher,
      location,
      dayOfWeek,
      startTime,
      endTime,
      weeks,
      color,
    });
    res.send({
      code: 0,
      data: course,
    });
  } catch (err) {
    res.send({
      code: -1,
      error: err.toString(),
    });
  }
});

// 删除课程
router.delete('/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Course.destroy({
      where: { id },
    });
    res.send({
      code: 0,
      data: 'deleted',
    });
  } catch (err) {
    res.send({
      code: -1,
      error: err.toString(),
    });
  }
});

module.exports = router;
