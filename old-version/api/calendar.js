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
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Generate iCal format
const generateICal = (duties, title) => {
  const ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ResLife//Duty Calendar//EN',
    `X-WR-CALNAME:${title}`,
    'X-WR-CALDESC:ResLife Duty Calendar',
  ];
  
  duties.forEach(duty => {
    const date = new Date(duty.date);
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    
    ical.push(
      'BEGIN:VEVENT',
      `UID:${duty.id}@reslife-calendar`,
      `DTSTART;VALUE=DATE:${dateStr}`,
      `DTEND;VALUE=DATE:${dateStr}`,
      `SUMMARY:${duty.type} Duty - ${duty.user_name}`,
      duty.notes ? `DESCRIPTION:${duty.notes}` : '',
      'END:VEVENT'
    );
  });
  
  ical.push('END:VCALENDAR');
  return ical.filter(line => line).join('\\r\\n');
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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get subscription type from query
    const { type, token } = req.query;
    
    let userId = null;
    let calendarTitle = 'ResLife Duty Calendar';
    
    // For personal calendars, verify token
    if (type === 'personal') {
      if (!token) {
        return res.status(401).json({ error: 'Token required for personal calendar' });
      }
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
        
        const user = await sql`
          SELECT name FROM users WHERE id = ${userId}
        `;
        
        if (user.length > 0) {
          calendarTitle = `${user[0].name}'s Duty Calendar`;
        }
      } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    }
    
    // Build query
    let query = `
      SELECT d.*, u.name as user_name
      FROM duties d
      JOIN users u ON d.user_id = u.id
      WHERE d.date >= CURRENT_DATE
    `;
    
    const params = [];
    
    if (userId) {
      params.push(userId);
      query += ` AND d.user_id = $${params.length}`;
    }
    
    query += ' ORDER BY d.date ASC';
    
    const duties = await sql(query, params);
    
    // Generate iCal content
    const icalContent = generateICal(duties, calendarTitle);
    
    // Set headers for iCal file
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="reslife-duties.ics"`);
    
    return res.status(200).send(icalContent);
  } catch (error) {
    console.error('Calendar API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}