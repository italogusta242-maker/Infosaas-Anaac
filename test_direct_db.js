const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Wall99696332$@db.hyjpxscsixeoibzhhtaf.supabase.co:6543/postgres';

const client = new Client({
  connectionString: connectionString,
  connectionTimeoutMillis: 30000,
});

async function testConnect() {
  try {
    console.log('Tentando conexão direta (Porta 6543)...');
    await client.connect();
    console.log('Conectado!');
    const res = await client.query('SELECT NOW()');
    console.log('Resultado:', res.rows[0]);
  } catch (err) {
    console.error('ERRO:', err.message);
  } finally {
    await client.end();
  }
}

testConnect();
