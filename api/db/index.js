const { sql } = require('@vercel/postgres');

const db = {
  query: async (text, params) => {
    try {
      const result = await sql.query(text, params);
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }
};

module.exports = db;