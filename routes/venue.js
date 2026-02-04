const express = require('express');
const router = express.Router();
const { Venue, VenueBooking } = require('../db');
const { Op } = require('sequelize');

// --- Venue Management (Public/Admin) ---

// Get all venues (Admin can see all, Users typically see open ones, but for listing we show all with status)
router.get('/venues', async (req, res) => {
  try {
    const venues = await Venue.findAll({
      order: [['id', 'ASC']]
    });
    res.send({ code: 0, data: venues });
  } catch (err) {
    res.send({ code: -1, error: err.toString() });
  }
});

// Add Venue (Admin)
router.post('/venues', async (req, res) => {
  const { name, type, location, capacity, status, openHours, imageUrl, description } = req.body;
  if (!name) return res.send({ code: -1, error: '名称必填' });
  
  try {
    const venue = await Venue.create({
      name, type, location, capacity, status, openHours, imageUrl, description
    });
    res.send({ code: 0, data: venue });
  } catch (err) {
    res.send({ code: -1, error: err.toString() });
  }
});

// Update Venue (Admin)
router.put('/venues/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const venue = await Venue.findByPk(id);
    if (!venue) return res.send({ code: -1, error: '场馆不存在' });
    
    await venue.update(req.body);
    res.send({ code: 0, data: venue });
  } catch (err) {
    res.send({ code: -1, error: err.toString() });
  }
});

// Delete Venue (Admin)
router.delete('/venues/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await Venue.destroy({ where: { id } });
    res.send({ code: 0, data: 'deleted' });
  } catch (err) {
    res.send({ code: -1, error: err.toString() });
  }
});


// --- Booking Management ---

// Get Bookings (Admin - All; User - My)
router.get('/venues/bookings', async (req, res) => {
  const openid = req.headers['x-wx-openid'];
  const { isAdmin } = req.query; // Simple check, in real app use middleware
  
  try {
    let where = {};
    if (!isAdmin) {
      if (!openid) return res.send({ code: -1, error: '未登录' });
      where.openid = openid;
    }
    
    const bookings = await VenueBooking.findAll({
      where,
      order: [['bookDate', 'DESC'], ['startTime', 'ASC']]
    });
    
    // For admin, maybe include Venue name details if not joined? 
    // Let's do a manual fetch or join if needed. 
    // Since we didn't set up complex associations in db.js strictly yet, let's fetch venues to map names.
    const venues = await Venue.findAll();
    const venueMap = {};
    venues.forEach(v => venueMap[v.id] = v);
    
    const result = bookings.map(b => {
      const v = venueMap[b.venueId] || {};
      return {
        ...b.toJSON(),
        venueName: v.name,
        venueLocation: v.location
      };
    });
    
    res.send({ code: 0, data: result });
  } catch (err) {
    res.send({ code: -1, error: err.toString() });
  }
});

// Create Booking (User)
router.post('/venues/bookings', async (req, res) => {
  const openid = req.headers['x-wx-openid'];
  if (!openid) return res.send({ code: -1, error: '未登录' });
  
  const { venueId, userName, userPhone, bookDate, startTime, endTime, reason } = req.body;
  
  if (!venueId || !bookDate || !startTime || !endTime) {
    return res.send({ code: -1, error: '缺少必填参数' });
  }
  
  try {
    // Check conflict
    const conflict = await VenueBooking.findOne({
      where: {
        venueId,
        bookDate,
        status: { [Op.in]: ['pending', 'approved'] },
        [Op.or]: [
          {
            startTime: { [Op.lt]: endTime },
            endTime: { [Op.gt]: startTime }
          }
        ]
      }
    });
    
    if (conflict) {
      return res.send({ code: -1, error: '该时间段已被预约' });
    }
    
    const booking = await VenueBooking.create({
      venueId, openid, userName, userPhone, bookDate, startTime, endTime, reason, status: 'pending'
    });
    
    res.send({ code: 0, data: booking });
  } catch (err) {
    res.send({ code: -1, error: err.toString() });
  }
});

// Audit Booking (Admin)
router.post('/venues/bookings/:id/audit', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // approved, rejected
  
  try {
    const booking = await VenueBooking.findByPk(id);
    if (!booking) return res.send({ code: -1, error: '预约不存在' });
    
    booking.status = status;
    await booking.save();
    res.send({ code: 0, data: booking });
  } catch (err) {
    res.send({ code: -1, error: err.toString() });
  }
});

module.exports = router;
