const express = require('express');
const router = express.Router();
const { Venue, VenueBooking } = require('../db');
const { Op } = require('sequelize');

// --- Venue Management (Public/Admin) ---

// Get all venues (Admin can see all, Users typically see open ones, but for listing we show all with status)
router.get('/venues', async (req, res) => {
  try {
    let venues = await Venue.findAll({
      order: [['id', 'ASC']]
    });
    
    // Auto-seed for demo if empty
    if (venues.length === 0) {
       await Venue.bulkCreate([
         { name: '第一教学楼101', type: 'classroom', status: 'open', openHours: '08:00-22:00', location: '一教' },
         { name: '体育馆羽毛球场1号', type: 'sports', status: 'open', openHours: '09:00-21:00', location: '体育馆' },
         { name: '行政楼会议室205', type: 'meeting', status: 'maintenance', openHours: '08:00-18:00', location: '行政楼' },
         { name: '图书馆自习室A区', type: 'classroom', status: 'open', openHours: '07:00-23:00', location: '图书馆' }
       ]);
       venues = await Venue.findAll({ order: [['id', 'ASC']] });
    }

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

// Create Booking (User or Admin)
router.post('/venues/bookings', async (req, res) => {
  let openid = req.headers['x-wx-openid'];
  const { venueId, userName, userPhone, bookDate, startTime, endTime, reason, isAdmin } = req.body;

  // Allow admin to book without openid (assign 'ADMIN')
  if (!openid) {
      if (isAdmin) {
          openid = 'ADMIN';
      } else {
          return res.send({ code: -1, error: '未登录' });
      }
  }
  
  if (!venueId || !bookDate || !startTime || !endTime) {
    return res.send({ code: -1, error: '缺少必填参数' });
  }
  
  try {
    // Debug logging
    console.log('Booking Request:', { venueId, bookDate, startTime, endTime, openid });

    // Validate times
    const parseTime = (t) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    };
    
    const startMin = parseTime(startTime);
    const endMin = parseTime(endTime);
    
    if (startMin >= endMin) {
        return res.send({ code: -1, error: '开始时间必须早于结束时间' });
    }

    // Check conflict (Fetch all bookings for the day and check in JS for safety)
    const existingBookings = await VenueBooking.findAll({
      where: {
        venueId,
        bookDate,
        status: { [Op.in]: ['pending', 'approved'] }
      }
    });

    for (const booking of existingBookings) {
        const bStart = parseTime(booking.startTime);
        const bEnd = parseTime(booking.endTime);

        // Overlap: (StartA < EndB) and (EndA > StartB)
        if (bStart < endMin && bEnd > startMin) {
             console.log('Conflict Found:', booking.toJSON());
             return res.send({ code: -1, error: `该时间段已被预约 (${booking.startTime}-${booking.endTime})` });
        }
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
