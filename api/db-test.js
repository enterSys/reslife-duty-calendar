module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const dbConfig = {
    hasPostgresUrl: !!process.env.POSTGRES_URL,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasJwtSecret: !!process.env.JWT_SECRET,
    nodeEnv: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL
  };
  
  try {
    // Try to import the db module
    const db = require('./db');
    
    // Try a simple query
    const result = await db.query('SELECT NOW() as current_time');
    
    res.json({
      status: 'success',
      config: dbConfig,
      dbTest: {
        connected: true,
        currentTime: result.rows[0].current_time
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      config: dbConfig,
      error: {
        message: error.message,
        stack: error.stack
      }
    });
  }
};