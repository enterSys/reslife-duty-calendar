const express = require('express');
const ical = require('ical-generator');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Create calendar subscription
router.post('/subscribe', authMiddleware, async (req, res) => {
  try {
    const { name, includeAllDuties } = req.body;
    const userId = req.user.id;
    const token = uuidv4();

    const result = await db.query(
      'INSERT INTO calendar_subscriptions (user_id, token, name, include_all_duties) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, token, name || 'ResLife Duties', includeAllDuties || false]
    );

    const subscription = result.rows[0];
    const calendarUrl = `${process.env.APP_URL}/api/calendar/feed/${token}`;

    res.json({
      id: subscription.id,
      name: subscription.name,
      url: calendarUrl,
      googleCalendarUrl: `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(calendarUrl)}`
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get calendar feed
router.get('/feed/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Get subscription
    const subResult = await db.query(
      'SELECT * FROM calendar_subscriptions WHERE token = $1',
      [token]
    );

    if (subResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid subscription' });
    }

    const subscription = subResult.rows[0];

    // Update last accessed
    await db.query(
      'UPDATE calendar_subscriptions SET last_accessed = NOW() WHERE id = $1',
      [subscription.id]
    );

    // Get duties
    let dutyQuery = `
      SELECT d.*, u.full_name 
      FROM duties d 
      JOIN users u ON d.user_id = u.id 
      WHERE d.duty_date >= CURRENT_DATE - INTERVAL '1 month'
    `;
    const params = [];

    if (!subscription.include_all_duties) {
      params.push(subscription.user_id);
      dutyQuery += ` AND d.user_id = $${params.length}`;
    }

    dutyQuery += ' ORDER BY d.duty_date ASC';

    const duties = await db.query(dutyQuery, params);

    // Create iCal
    const calendar = ical({
      name: subscription.name,
      description: 'ResLife Duty Calendar',
      timezone: 'UTC'
    });

    // Add duties as events
    duties.rows.forEach(duty => {
      calendar.createEvent({
        start: new Date(duty.duty_date),
        end: new Date(duty.duty_date),
        allDay: true,
        summary: `${duty.duty_type} Duty - ${duty.full_name}`,
        description: duty.notes || '',
        uid: `duty-${duty.id}@reslife-calendar`
      });
    });

    res.set('Content-Type', 'text/calendar');
    res.send(calendar.toString());
  } catch (error) {
    console.error('Get calendar feed error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's subscriptions
router.get('/subscriptions', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      'SELECT id, name, include_all_duties, created_at, last_accessed FROM calendar_subscriptions WHERE user_id = $1',
      [userId]
    );

    const subscriptions = result.rows.map(sub => ({
      ...sub,
      url: `${process.env.APP_URL}/api/calendar/feed/${sub.token}`
    }));

    res.json(subscriptions);
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete subscription
router.delete('/subscriptions/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await db.query(
      'DELETE FROM calendar_subscriptions WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json({ message: 'Subscription deleted' });
  } catch (error) {
    console.error('Delete subscription error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;