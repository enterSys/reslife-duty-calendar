const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all duties (with optional date range)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;
    
    let query = `
      SELECT d.*, u.full_name 
      FROM duties d 
      JOIN users u ON d.user_id = u.id 
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      params.push(startDate);
      query += ` AND d.duty_date >= $${params.length}`;
    }

    if (endDate) {
      params.push(endDate);
      query += ` AND d.duty_date <= $${params.length}`;
    }

    if (userId) {
      params.push(userId);
      query += ` AND d.user_id = $${params.length}`;
    }

    query += ' ORDER BY d.duty_date ASC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get duties error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create duty
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { dutyDate, dutyType, notes, userId } = req.body;
    
    // Admin check would go here
    const assignedUserId = userId || req.user.id;

    const result = await db.query(
      'INSERT INTO duties (user_id, duty_date, duty_type, notes) VALUES ($1, $2, $3, $4) RETURNING *',
      [assignedUserId, dutyDate, dutyType, notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create duty error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update duty
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { dutyDate, dutyType, notes } = req.body;

    const result = await db.query(
      'UPDATE duties SET duty_date = $1, duty_type = $2, notes = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
      [dutyDate, dutyType, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Duty not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update duty error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete duty
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM duties WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Duty not found' });
    }

    res.json({ message: 'Duty deleted successfully' });
  } catch (error) {
    console.error('Delete duty error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;