const express = require('express');
const router = express.Router();
const { CanteenDish } = require('../db');

// 获取所有菜品 (按分类分组)
router.get('/canteen/dishes', async (req, res) => {
  try {
    const dishes = await CanteenDish.findAll({
      where: { isAvailable: true },
      order: [['category', 'DESC'], ['id', 'ASC']]
    });
    res.send({ code: 0, data: dishes });
  } catch (err) {
    res.send({ code: -1, error: err.toString() });
  }
});

// 管理端：获取所有菜品
router.get('/admin/canteen/dishes', async (req, res) => {
  try {
    const dishes = await CanteenDish.findAll({
      order: [['category', 'DESC'], ['id', 'DESC']]
    });
    res.send({ code: 0, data: dishes });
  } catch (err) {
    res.send({ code: -1, error: err.toString() });
  }
});

// 新增菜品
router.post('/canteen/dishes', async (req, res) => {
  const { name, category, price, imageUrl, description } = req.body;
  if (!name || !price) {
    res.send({ code: -1, error: '名称和价格必填' });
    return;
  }
  try {
    const dish = await CanteenDish.create({
      name, category, price, imageUrl, description
    });
    res.send({ code: 0, data: dish });
  } catch (err) {
    res.send({ code: -1, error: err.toString() });
  }
});

// 删除菜品
router.delete('/canteen/dishes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await CanteenDish.destroy({ where: { id } });
    res.send({ code: 0, data: 'deleted' });
  } catch (err) {
    res.send({ code: -1, error: err.toString() });
  }
});

// 批量导入菜品 (CSV JSON)
router.post('/canteen/dishes/import', async (req, res) => {
    const { csv, replace } = req.body; // csv is parsed JSON array from frontend
    if (!Array.isArray(csv)) {
        return res.send({ code: -1, error: '无效的数据格式' });
    }

    try {
        if (replace) {
            await CanteenDish.destroy({ truncate: true });
        }

        const errors = [];
        let created = 0;
        let skipped = 0;

        for (const row of csv) {
            // CSV columns: name, category, price, description
            // Check required
            if (!row.name || !row.price) {
                skipped++;
                continue;
            }
            
            try {
                await CanteenDish.create({
                    name: row.name,
                    category: row.category || '其他',
                    price: parseFloat(row.price),
                    description: row.description || '',
                    imageUrl: row.imageUrl || ''
                });
                created++;
            } catch (e) {
                errors.push(`Row ${row.name}: ${e.message}`);
            }
        }

        res.send({ code: 0, data: { created, skipped, errors } });

    } catch (err) {
        res.send({ code: -1, error: err.toString() });
    }
});

module.exports = router;
