/**
 * Test direct PostgreSQL connection to Supabase
 */

const { Client } = require('pg');

// Connection details
const connectionString = 'postgres://postgres:REPLACE_WITH_YOUR_SUPABASE_DB_PASSWORD@ltwqmnffgrrigyeujyvc.supabase.co:5432/postgres';

// Create a new client
const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

// Connect to the database
console.log('Connecting to Supabase PostgreSQL database...');
client.connect()
  .then(() => {
    console.log('✅ Connection successful!');
    
    // Query to get PostgreSQL version
    return client.query('SELECT version()');
  })
  .then(res => {
    console.log('PostgreSQL version:', res.rows[0].version);
    
    // Query to list tables
    return client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
  })
  .then(res => {
    if (res.rows.length === 0) {
      console.log('No tables found in the public schema.');
    } else {
      console.log('Tables in the public schema:');
      res.rows.forEach(row => {
        console.log(`- ${row.table_name}`);
      });
    }
  })
  .catch(err => {
    console.error('❌ Connection error:', err.message);
  })
  .finally(() => {
    // Close the connection
    client.end();
  }); 