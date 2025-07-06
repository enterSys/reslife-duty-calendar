import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

const sql = neon(process.env.DATABASE_URL);

// Verify JWT token
const verifyToken = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }
  
  const token = authHeader.split(' ')[1];
  return jwt.verify(token, process.env.JWT_SECRET);
};

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).setHeaders(corsHeaders).end();
  }

  // Set CORS headers for all responses
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  try {
    // Verify authentication for all requests
    const user = verifyToken(req.headers.authorization);

    if (req.method === 'GET') {
      // Get swap requests
      const { status } = req.query;
      
      let query = `
        SELECT s.*, 
               d.date, d.type as duty_type,
               u1.name as requester_name,
               u2.name as target_name
        FROM swap_requests s
        JOIN duties d ON s.duty_id = d.id
        JOIN users u1 ON s.requester_id = u1.id
        LEFT JOIN users u2 ON s.target_user_id = u2.id
        WHERE (s.requester_id = $1 OR s.target_user_id = $1)
      `;
      
      const params = [user.userId];
      
      if (status) {
        params.push(status);
        query += ` AND s.status = $${params.length}`;
      }
      
      query += ' ORDER BY s.created_at DESC';
      
      const swaps = await sql(query, params);
      return res.status(200).json(swaps);
    }

    if (req.method === 'POST') {
      // Create swap request
      const { duty_id, target_user_id, message } = req.body;
      
      // Verify the duty belongs to the requester
      const duty = await sql`
        SELECT * FROM duties WHERE id = ${duty_id} AND user_id = ${user.userId}
      `;
      
      if (duty.length === 0) {
        return res.status(403).json({ error: 'You can only swap your own duties' });
      }
      
      const result = await sql`
        INSERT INTO swap_requests (duty_id, requester_id, target_user_id, message, status)
        VALUES (${duty_id}, ${user.userId}, ${target_user_id}, ${message}, 'pending')
        RETURNING *
      `;
      
      return res.status(201).json(result[0]);
    }

    if (req.method === 'PUT') {
      // Update swap request (accept/reject)
      const { id } = req.query;
      const { status } = req.body;
      
      if (!['accepted', 'rejected', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      
      // Get the swap request
      const swap = await sql`
        SELECT * FROM swap_requests WHERE id = ${id}
      `;
      
      if (swap.length === 0) {
        return res.status(404).json({ error: 'Swap request not found' });
      }
      
      // Check permissions
      if (status === 'cancelled' && swap[0].requester_id !== user.userId) {
        return res.status(403).json({ error: 'Only requester can cancel' });
      }
      
      if (['accepted', 'rejected'].includes(status) && swap[0].target_user_id !== user.userId) {
        return res.status(403).json({ error: 'Only target user can accept/reject' });
      }
      
      // Update status
      const result = await sql`
        UPDATE swap_requests
        SET status = ${status}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;
      
      // If accepted, swap the duty assignment
      if (status === 'accepted') {
        await sql`
          UPDATE duties
          SET user_id = ${swap[0].target_user_id}
          WHERE id = ${swap[0].duty_id}
        `;
      }
      
      return res.status(200).json(result[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Swaps API error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}