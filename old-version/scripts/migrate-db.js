const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
    console.error('❌ Error: DATABASE_URL or POSTGRES_URL not found in environment variables');
    console.log('Make sure you have a .env file with your Neon database credentials');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL);
  
  try {
    console.log('🚀 Running database migration...');
    
    // Read schema file
    const schemaPath = path.join(__dirname, '..', 'api', 'db', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by semicolons and execute each statement
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      await sql(statement + ';');
    }
    
    console.log('✅ Database migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();