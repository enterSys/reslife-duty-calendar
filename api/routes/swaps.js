const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get swap requests
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const query = `
      SELECT 
        ds.*,
        u1.full_name as requester_name,
        u2.full_name as requested_with_name,
        d1.duty_date as requester_duty_date,
        d1.duty_type as requester_duty_type,
        d2.duty_date as requested_duty_date,
        d2.duty_type as requested_duty_type
      FROM duty_swaps ds
      JOIN users u1 ON ds.requester_id = u1.id
      JOIN users u2 ON ds.requested_with_id = u2.id
      JOIN duties d1 ON ds.requester_duty_id = d1.id
      JOIN duties d2 ON ds.requested_duty_id = d2.id
      WHERE ds.requester_id = $1 OR ds.requested_with_id = $1
      ORDER BY ds.created_at DESC
    `;

    const result = await db.query(query, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Get swaps error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create swap request
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { requesterDutyId, requestedDutyId, reason } = req.body;
    const requesterId = req.user.id;

    // Get duties info
    const duties = await db.query(
      'SELECT * FROM duties WHERE id IN ($1, $2)',
      [requesterDutyId, requestedDutyId]
    );

    if (duties.rows.length !== 2) {
      return res.status(400).json({ error: 'Invalid duty IDs' });
    }

    const requesterDuty = duties.rows.find(d => d.id === parseInt(requesterDutyId));
    const requestedDuty = duties.rows.find(d => d.id === parseInt(requestedDutyId));

    if (requesterDuty.user_id !== requesterId) {
      return res.status(403).json({ error: 'You can only swap your own duties' });
    }

    // Create swap request
    const result = await db.query(
      `INSERT INTO duty_swaps 
       (requester_id, requested_with_id, requester_duty_id, requested_duty_id, reason) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [requesterId, requestedDuty.user_id, requesterDutyId, requestedDutyId, reason]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create swap error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Respond to swap request
router.put('/:id/respond', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { accept } = req.body;
    const userId = req.user.id;

    // Get swap request
    const swapResult = await db.query(
      'SELECT * FROM duty_swaps WHERE id = $1',
      [id]
    );

    if (swapResult.rows.length === 0) {
      return res.status(404).json({ error: 'Swap request not found' });
    }

    const swap = swapResult.rows[0];

    // Check if user is the requested party
    if (swap.requested_with_id !== userId) {
      return res.status(403).json({ error: 'You cannot respond to this swap request' });
    }

    if (swap.status !== 'pending') {
      return res.status(400).json({ error: 'This swap request has already been processed' });
    }

    const newStatus = accept ? 'accepted' : 'rejected';

    // Update swap status
    await db.query(
      'UPDATE duty_swaps SET status = $1, requested_approved = $2, updated_at = NOW() WHERE id = $3',
      [newStatus, accept, id]
    );

    // If accepted, swap the duties
    if (accept) {
      await db.query('BEGIN');
      
      try {
        // Swap user assignments
        await db.query(
          'UPDATE duties SET user_id = $1 WHERE id = $2',
          [swap.requested_with_id, swap.requester_duty_id]
        );
        
        await db.query(
          'UPDATE duties SET user_id = $1 WHERE id = $2',
          [swap.requester_id, swap.requested_duty_id]
        );
        
        await db.query('COMMIT');
      } catch (error) {
        await db.query('ROLLBACK');
        throw error;
      }
    }

    res.json({ message: `Swap request ${newStatus}` });
  } catch (error) {
    console.error('Respond to swap error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Cancel swap request
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await db.query(
      'UPDATE duty_swaps SET status = $1, updated_at = NOW() WHERE id = $2 AND requester_id = $3 AND status = $4 RETURNING *',
      ['cancelled', id, userId, 'pending']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Swap request not found or cannot be cancelled' });
    }

    res.json({ message: 'Swap request cancelled' });
  } catch (error) {
    console.error('Cancel swap error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;