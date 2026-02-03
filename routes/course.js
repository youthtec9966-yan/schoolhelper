const express = require('express');
const router = express.Router();
const { Course } = require('../db');

function splitCsv(text) {
  const rows = [];
  const row = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  const input = String(text == null ? '' : text);

  while (i < input.length) {
    const ch = input[i];
    if (ch === '"') {
      const next = input[i + 1];
      if (inQuotes && next === '"') {
        field += '"';
        i += 2;
        continue;
      }
      inQuotes = !inQuotes;
      i += 1;
      continue;
    }

    if (!inQuotes && (ch === ',' || ch === '\n' || ch === '\r')) {
      row.push(field);
      field = '';

      if (ch === ',') {
        i += 1;
        continue;
      }

      if (ch === '\r' && input[i + 1] === '\n') i += 2;
      else i += 1;

      rows.push(row.splice(0, row.length));
      continue;
    }

    field += ch;
    i += 1;
  }

  row.push(field);
  rows.push(row);
  return rows.filter(r => r.some(cell => String(cell == null ? '' : cell).trim() !== ''));
}

function normalizeHeader(raw) {
  const key = String(raw == null ? '' : raw).trim().toLowerCase();
  const map = {
    name: 'name',
    teacher: 'teacher',
    location: 'location',
    dayofweek: 'dayOfWeek',
    starttime: 'startTime',
    endtime: 'endTime',
    weeks: 'weeks',
    color: 'color',
    '课程名称': 'name',
    '教师': 'teacher',
    '老师': 'teacher',
    '地点': 'location',
    '教室': 'location',
    '星期': 'dayOfWeek',
    '周几': 'dayOfWeek',
    '开始时间': 'startTime',
    '结束时间': 'endTime',
    '周数': 'weeks',
    '颜色': 'color',
  };
  return map[key] || map[String(raw == null ? '' : raw).trim()] || null;
}

function isTimeStr(value) {
  const s = String(value == null ? '' : value).trim();
  if (!/^\d{2}:\d{2}$/.test(s)) return false;
  const [hh, mm] = s.split(':').map(v => Number(v));
  return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
}

function toCoursePayload(row, headerIndexMap) {
  const get = (k) => {
    const idx = headerIndexMap[k];
    if (idx === undefined) return '';
    return String(row[idx] == null ? '' : row[idx]).trim();
  };

  const name = get('name');
  const dayOfWeek = Number.parseInt(get('dayOfWeek'), 10);
  const startTime = get('startTime');
  const endTime = get('endTime');

  if (!name) return { ok: false, error: '课程名称为空' };
  if (!(dayOfWeek >= 1 && dayOfWeek <= 7)) return { ok: false, error: '星期需为1-7' };
  if (!isTimeStr(startTime)) return { ok: false, error: '开始时间格式应为HH:MM' };
  if (!isTimeStr(endTime)) return { ok: false, error: '结束时间格式应为HH:MM' };

  return {
    ok: true,
    data: {
      name,
      teacher: get('teacher') || null,
      location: get('location') || null,
      dayOfWeek,
      startTime,
      endTime,
      weeks: get('weeks') || null,
      color: get('color') || null,
    }
  };
}

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

router.get('/courses/template', async (req, res) => {
  const bom = '\ufeff';
  const header = ['name', 'teacher', 'location', 'dayOfWeek', 'startTime', 'endTime', 'weeks', 'color'].join(',');
  const example = ['人工智能导论', '张教授', 'A201', '1', '08:00', '09:35', '1-16周', '#2979ff']
    .map(v => `"${String(v).replace(/"/g, '""')}"`)
    .join(',');
  const content = `${bom}${header}\n${example}\n`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="courses_template.csv"');
  res.status(200).send(content);
});

router.post('/courses/import', async (req, res) => {
  try {
    const body = req.body || {};
    const csv = body.csv;
    const replace = !!body.replace;
    if (typeof csv !== 'string' || csv.trim() === '') {
      res.send({ code: -1, error: 'csv 不能为空' });
      return;
    }

    const rows = splitCsv(csv);
    if (rows.length < 2) {
      res.send({ code: -1, error: 'CSV 至少包含表头与一行数据' });
      return;
    }

    const headerRow = rows[0];
    const headerIndexMap = {};
    headerRow.forEach((h, idx) => {
      const key = normalizeHeader(h);
      if (key) headerIndexMap[key] = idx;
    });

    const required = ['name', 'dayOfWeek', 'startTime', 'endTime'];
    const missing = required.filter(k => headerIndexMap[k] === undefined);
    if (missing.length) {
      res.send({ code: -1, error: `缺少表头字段: ${missing.join(',')}` });
      return;
    }

    const errors = [];
    const payloads = [];
    for (let i = 1; i < rows.length; i += 1) {
      const row = rows[i];
      const result = toCoursePayload(row, headerIndexMap);
      if (!result.ok) {
        errors.push(`第${i + 1}行：${result.error}`);
        continue;
      }
      payloads.push(result.data);
    }

    if (replace) {
      await Course.destroy({ truncate: true });
    }

    let created = 0;
    if (payloads.length) {
      const createdList = await Course.bulkCreate(payloads);
      created = createdList.length;
    }

    res.send({
      code: 0,
      data: {
        created,
        skipped: errors.length,
        errors,
      },
    });
  } catch (err) {
    res.send({ code: -1, error: err.toString() });
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
