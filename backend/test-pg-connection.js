/**
 * Test direct PostgreSQL connection to Supabase
 */

const { Client } = require('pg');

// Connection details
const connectionString = 'postgres://postgres:REPLACE_WITH_YOUR_SUPABASE_DB_PASSWORD@ltwqmnffgrrigyeujyvc.supabase.co:5432/postgres';

console.log('Using connection string (redacted password):',
  connectionString.replace(/postgres:(.+?)@/, 'postgres:****@'));

// Create a new client
const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  // Increase connection timeout for cloud databases
  connectionTimeoutMillis: 10000
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
    console.error('Error details:', err);
    
    // More specific error handling based on error types
    if (err.code === 'ENOTFOUND') {
      console.error('🔍 Host not found. Please check if the database host is correct.');
    } else if (err.code === 'ETIMEDOUT') {
      console.error('⏱️ Connection timed out. The database might be down or unreachable.');
    } else if (err.code === '28P01') {
      console.error('🔑 Authentication failed. Please check your database password.');
    } else if (err.code === '3D000') {
      console.error('📦 Database not found. Please check if the database name is correct.');
    }
    
    // Try with alternate connection format for troubleshooting
    console.log('\nTrying alternate connection format...');
    const altClient = new Client({
      host: 'ltwqmnffgrrigyeujyvc.supabase.co',
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: connectionString.split(':')[2].split('@')[0],
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 10000
    });
    
    return altClient.connect()
      .then(() => {
        console.log('✅ Alternate connection successful!');
        altClient.end();
      })
      .catch(altErr => {
        console.error('❌ Alternate connection also failed:', altErr.message);
      });
  })
  .finally(() => {
    // Close the connection
    client.end();
  }); 