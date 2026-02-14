const { createClient } = require('@libsql/client');
const path = require('path');

const dbPath = path.resolve(process.cwd(), 'dev.db');
const dbUrl = `file:${dbPath}`;
console.log('Testing dbUrl:', dbUrl);

const client = createClient({
  url: dbUrl,
});

async function test() {
  try {
    const rs = await client.execute('SELECT 1');
    console.log('Success:', rs);
  } catch (e) {
    console.error('Error:', e);
  }
}

test();
