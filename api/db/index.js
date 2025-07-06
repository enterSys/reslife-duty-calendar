const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL);

const db = {
  query: async (text, params = []) => {
    try {
      const result = await sql(text, params);
      return {
        rows: result,
        rowCount: result.length
      };
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }
};

module.exports = db;