import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkSchema() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'pos_invoices'
    `);
    console.log('Columns in pos_invoices:');
    res.rows.forEach(row => console.log(`- ${row.column_name} (${row.data_type})`));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkSchema();
