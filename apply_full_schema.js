import pkg from 'pg';
import fs from 'fs';
const { Client } = pkg;

const connectionString = 'postgresql://postgres:PWDanaac@01@52.203.111.90:5432/postgres';

async function runSQL() {
  const sql = fs.readFileSync('FULL_SCHEMA.sql', 'utf8');
  const client = new Client({ connectionString });
  
  try {
    console.log('--- Conectando ao Banco de Dados Supabase ---');
    await client.connect();
    console.log('Conectado. Aplicando FULL_SCHEMA.sql (isso pode demorar)...');
    
    // Executa o SQL. O script contém múltiplos comandos, então o pg vai rodar como uma transação se possível.
    await client.query(sql);
    
    console.log('✅ SCHEMA APLICADO COM SUCESSO!');
  } catch (err) {
    console.error('❌ ERRO AO APLICAR SQL:', err.message);
  } finally {
    await client.end();
  }
}

runSQL();
