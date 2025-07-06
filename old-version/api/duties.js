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
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
      // Get duties with optional filters
      const { start_date, end_date, user_id } = req.query;
      
      let query = 'SELECT * FROM duties WHERE 1=1';
      const params = [];
      
      if (start_date) {
        params.push(start_date);
        query += ` AND date >= $${params.length}`;
      }
      
      if (end_date) {
        params.push(end_date);
        query += ` AND date <= $${params.length}`;
      }
      
      if (user_id) {
        params.push(user_id);
        query += ` AND user_id = $${params.length}`;
      }
      
      query += ' ORDER BY date ASC';
      
      const duties = await sql(query, params);
      return res.status(200).json(duties);
    }

    if (req.method === 'POST') {
      // Create new duty (admin only)
      if (user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { user_id, date, type, notes } = req.body;
      
      const result = await sql`
        INSERT INTO duties (user_id, date, type, notes)
        VALUES (${user_id}, ${date}, ${type}, ${notes})
        RETURNING *
      `;
      
      return res.status(201).json(result[0]);
    }

    if (req.method === 'PUT') {
      // Update duty (admin only)
      if (user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { id } = req.query;
      const { user_id, date, type, notes } = req.body;
      
      const result = await sql`
        UPDATE duties
        SET user_id = ${user_id}, date = ${date}, type = ${type}, notes = ${notes}
        WHERE id = ${id}
        RETURNING *
      `;
      
      if (result.length === 0) {
        return res.status(404).json({ error: 'Duty not found' });
      }
      
      return res.status(200).json(result[0]);
    }

    if (req.method === 'DELETE') {
      // Delete duty (admin only)
      if (user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { id } = req.query;
      
      const result = await sql`
        DELETE FROM duties
        WHERE id = ${id}
        RETURNING *
      `;
      
      if (result.length === 0) {
        return res.status(404).json({ error: 'Duty not found' });
      }
      
      return res.status(200).json({ message: 'Duty deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Duties API error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}