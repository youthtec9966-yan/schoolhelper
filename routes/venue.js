const express = require('express');
const router = express.Router();
const { Venue, VenueBooking, VenueSlot } = require('../db');
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

router.get('/venues/:id/slots/dates', async (req, res) => {
  const { id } = req.params;
  try {
    const slots = await VenueSlot.findAll({
      where: { venueId: id, status: 'open' },
      attributes: ['slotDate'],
      order: [['slotDate', 'ASC']]
    });
    const dates = Array.from(new Set(slots.map(s => s.slotDate)));
    res.send({ code: 0, data: dates });
  } catch (err) {
    res.send({ code: -1, error: err.toString() });
  }
});

router.get('/venues/:id/slots', async (req, res) => {
  const { id } = req.params;
  const { date } = req.query;
  try {
    const where = { venueId: id };
    if (date) where.slotDate = date;
    const slots = await VenueSlot.findAll({
      where,
      order: [['slotDate', 'ASC'], ['startTime', 'ASC']]
    });
    const slotIds = slots.map(s => s.id);
    
    // Fetch ALL bookings for this venue on this date (or all dates if date param missing, but usually date is present)
    // If date is missing, we need to be careful. But for now let's assume date is present or we fetch all relevant bookings.
    // Optimization: If date is provided, filter bookings by date.
    const bookingWhere = {
      venueId: id,
      status: { [Op.in]: ['pending', 'approved'] }
    };
    if (date) {
      bookingWhere.bookDate = date;
    }

    const bookings = await VenueBooking.findAll({
      where: bookingWhere
    });

    const bookedSlotIds = new Set();
    const manualBookings = [];

    bookings.forEach(b => {
      if (b.slotId) {
        bookedSlotIds.add(b.slotId);
      } else {
        manualBookings.push(b);
      }
    });

    const parseTime = (t) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    const data = slots.map(s => {
      let isBooked = bookedSlotIds.has(s.id);
      
      // Check overlap with manual bookings if not already booked directly
      if (!isBooked && manualBookings.length > 0) {
        const startMin = parseTime(s.startTime);
        const endMin = parseTime(s.endTime);
        for (const mb of manualBookings) {
          // Manual booking date must match (already filtered if date param exists, but double check if multiple dates)
          if (mb.bookDate === s.slotDate) {
            const bStart = parseTime(mb.startTime);
            const bEnd = parseTime(mb.endTime);
            // Overlap condition: (StartA < EndB) and (EndA > StartB)
            if (startMin < bEnd && endMin > bStart) {
              isBooked = true;
              break;
            }
          }
        }
      }

      return {
        ...s.toJSON(),
        available: s.status === 'open' && !isBooked
      };
    });
    
    res.send({ code: 0, data });
  } catch (err) {
    res.send({ code: -1, error: err.toString() });
  }
});

router.post('/venues/slots', async (req, res) => {
  const { venueId, slotDate, startTime, endTime, status } = req.body;
  if (!venueId || !slotDate || !startTime || !endTime) {
    return res.send({ code: -1, error: '缺少必填参数' });
  }
  try {
    const slot = await VenueSlot.create({
      venueId,
      slotDate,
      startTime,
      endTime,
      status: status || 'open'
    });
    res.send({ code: 0, data: slot });
  } catch (err) {
    res.send({ code: -1, error: err.toString() });
  }
});

router.put('/venues/slots/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const slot = await VenueSlot.findByPk(id);
    if (!slot) return res.send({ code: -1, error: '时段不存在' });
    await slot.update(req.body);
    res.send({ code: 0, data: slot });
  } catch (err) {
    res.send({ code: -1, error: err.toString() });
  }
});

router.delete('/venues/slots/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await VenueSlot.destroy({ where: { id } });
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
  const { venueId, slotId, userName, userPhone, bookDate, startTime, endTime, reason, isAdmin } = req.body;

  // Allow admin to book without openid (assign 'ADMIN')
  if (!openid) {
      if (isAdmin) {
          openid = 'ADMIN';
      } else {
          return res.send({ code: -1, error: '未登录' });
      }
  }
  
  if (!venueId || (!slotId && (!bookDate || !startTime || !endTime))) {
    return res.send({ code: -1, error: '缺少必填参数' });
  }
  
  try {
    if (slotId) {
      const slot = await VenueSlot.findByPk(slotId);
      if (!slot || String(slot.venueId) !== String(venueId)) {
        return res.send({ code: -1, error: '时段不存在' });
      }
      if (slot.status !== 'open') {
        return res.send({ code: -1, error: '该时段不可预约' });
      }
      const parseTime = (t) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
      };
      const startMin = parseTime(slot.startTime);
      const endMin = parseTime(slot.endTime);
      const existingSameUser = await VenueBooking.findOne({
        where: {
          slotId,
          openid,
          status: { [Op.in]: ['pending', 'approved'] }
        }
      });
      if (existingSameUser) {
        return res.send({ code: 0, data: existingSameUser, message: '已存在该时段预约' });
      }
      const existing = await VenueBooking.findOne({
        where: {
          slotId,
          status: { [Op.in]: ['pending', 'approved'] }
        }
      });
      if (existing) {
        return res.send({ code: -1, error: `该时间段已被预约 (${slot.startTime}-${slot.endTime})` });
      }
      const manualBookings = await VenueBooking.findAll({
        where: {
          venueId,
          bookDate: slot.slotDate,
          slotId: null,
          status: { [Op.in]: ['pending', 'approved'] }
        }
      });
      for (const booking of manualBookings) {
        const bStart = parseTime(booking.startTime);
        const bEnd = parseTime(booking.endTime);
        if (bStart < endMin && bEnd > startMin) {
          return res.send({ code: -1, error: `该时间段已被预约 (${booking.startTime}-${booking.endTime})` });
        }
      }
      const booking = await VenueBooking.create({
        venueId,
        slotId,
        openid,
        userName,
        userPhone,
        bookDate: slot.slotDate,
        startTime: slot.startTime,
        endTime: slot.endTime,
        reason,
        status: 'pending'
      });
      return res.send({ code: 0, data: booking });
    }

    const parseTime = (t) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const startMin = parseTime(startTime);
    const endMin = parseTime(endTime);
    if (startMin >= endMin) {
      return res.send({ code: -1, error: '开始时间必须早于结束时间' });
    }
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
      if (bStart < endMin && bEnd > startMin) {
        if (booking.openid === openid) {
          return res.send({ code: 0, data: booking, message: '已存在该时间段预约' });
        }
        return res.send({ code: -1, error: `该时间段已被预约 (${booking.startTime}-${booking.endTime})` });
      }
    }
    const booking = await VenueBooking.create({
      venueId,
      openid,
      userName,
      userPhone,
      bookDate,
      startTime,
      endTime,
      reason,
      status: 'pending'
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
