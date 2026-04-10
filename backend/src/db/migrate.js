/**
 * Applies schema migrations via Supabase Management API.
 * Run: node src/db/migrate.js
 */
require('dotenv').config();
const https = require('https');

const projectRef = process.env.SUPABASE_URL.replace('https://', '').split('.')[0];

const migrations = [
  'ALTER TABLE mentors ALTER COLUMN profile_id DROP NOT NULL',
  'ALTER TABLE match_requests ADD COLUMN IF NOT EXISTS mentee_username TEXT',
  'ALTER TABLE match_requests ADD COLUMN IF NOT EXISTS requested_field TEXT',
  'ALTER TABLE match_requests ADD COLUMN IF NOT EXISTS preferences TEXT',
  'ALTER TABLE match_requests ALTER COLUMN mentor_id DROP NOT NULL',
];

function runQuery(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const options = {
      hostname: 'api.supabase.com',
      path: `/v1/projects/${projectRef}/database/query`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function migrate() {
  console.log('🔧 Running migrations...\n');
  for (const sql of migrations) {
    try {
      const { status, body } = await runQuery(sql);
      const parsed = JSON.parse(body);
      if (status === 200 || status === 201 || (parsed && !parsed.error)) {
        console.log(`  ✓ ${sql.slice(0, 60)}`);
      } else {
        // 42701 = column already exists, that's fine
        const msg = parsed?.message || body;
        if (msg.includes('already exists') || msg.includes('42701')) {
          console.log(`  ⏭  Already done: ${sql.slice(0, 60)}`);
        } else {
          console.log(`  ⚠  ${sql.slice(0, 60)}\n     → ${msg.slice(0, 120)}`);
        }
      }
    } catch (err) {
      console.error(`  ✗ ${sql.slice(0, 60)}: ${err.message}`);
    }
  }
  console.log('\n✅ Migrations complete.');
}

migrate().catch(console.error);
