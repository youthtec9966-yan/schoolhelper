const express = require('express');
const router = express.Router();
const { Exam } = require('../db');

router.get('/exams', async (req, res) => {
  try {
    const list = await Exam.findAll({ order: [['examDate', 'ASC'], ['startTime', 'ASC'], ['id', 'ASC']] });
    res.send({ code: 0, data: list });
  } catch (err) {
    res.send({ code: -1, error: err.toString() });
  }
});

router.post('/exams', async (req, res) => {
  try {
    const { name, type, examDate, startTime, endTime, location, seat, remark } = req.body || {};
    if (!name || !examDate || !startTime || !endTime) {
      res.send({ code: -1, error: 'name/examDate/startTime/endTime 必填' });
      return;
    }
    const exam = await Exam.create({
      name,
      type: type || '期末',
      examDate,
      startTime,
      endTime,
      location,
      seat,
      remark,
    });
    res.send({ code: 0, data: exam });
  } catch (err) {
    res.send({ code: -1, error: err.toString() });
  }
});

router.delete('/exams/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Exam.destroy({ where: { id } });
    res.send({ code: 0, data: 'deleted' });
  } catch (err) {
    res.send({ code: -1, error: err.toString() });
  }
});

module.exports = router;
