const pass = process.argv[2];
if (!pass) process.exit(1);

const urls = [
  `postgresql://postgres.masefoylqhqfijszezla:${pass}@aws-1-us-east-1.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres.masefoylqhqfijszezla:${pass}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres.masefoylqhqfijszezla:${pass}@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true`,
  `postgresql://postgres:${pass}@db.masefoylqhqfijszezla.supabase.co:5432/postgres`,
];

const { Client } = await import('pg');

for (const url of urls) {
  const masked = url.replace(pass, '***');
  const client = new Client({ connectionString: url, connectionTimeoutMillis: 10000 });
  try {
    await client.connect();
    await client.query('SELECT 1 AS ok');
    console.log('SUCCESS:', masked);
    console.log('USE_THIS_URL=' + url);
    await client.end();
    process.exit(0);
  } catch (error) {
    console.log('FAIL:', masked, '-', error.message.split('\n')[0]);
    try { await client.end(); } catch {}
  }
}
process.exit(1);
