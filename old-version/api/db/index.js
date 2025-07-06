const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL);

const db = {
  query: async (text, params = []) => {
    try {
      // For parameterized queries with placeholders like $1, $2, etc.
      if (params.length > 0) {
        const result = await sql.query(text, params);
        return {
          rows: result,
          rowCount: result.length
        };
      } else {
        // For simple queries without parameters, use the tagged template
        const result = await sql(text);
        return {
          rows: result,
          rowCount: result.length
        };
      }
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }
};

module.exports = db;