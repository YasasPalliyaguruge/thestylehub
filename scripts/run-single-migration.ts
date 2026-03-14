import { Client } from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

dotenv.config({ path: '.env.local' });

async function runSpecificMigration(filename: string) {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    console.log(`Running migration: ${filename}`);
    const sql = readFileSync(join(process.cwd(), 'db/migrations', filename), 'utf-8');
    await client.query(sql);
    console.log('✅ Migration completed successfully!');
  } catch (err: any) {
    if (err.message?.includes('already exists')) {
      console.log('⚠ Migration already applied or columns already exist.');
    } else {
      console.error('❌ Migration failed:', err.message);
    }
  } finally {
    await client.end();
  }
}

const target = process.argv[2] || '014_add_employee_to_pos.sql';
runSpecificMigration(target);
