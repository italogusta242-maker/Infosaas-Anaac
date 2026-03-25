const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Usando a connection string do arquivo apply_schema.cjs que já existe no projeto
const connectionString = 'postgresql://postgres:Wall99696332$@db.hyjpxscsixeoibzhhtaf.supabase.co:5432/postgres';

const client = new Client({
  connectionString: connectionString,
  connectionTimeoutMillis: 20000,
});

async function applyMemberSchema() {
  try {
    console.log('Lendo arquivo MEMBER_AREA_SCHEMA.sql...');
    const sql = fs.readFileSync(path.join(__dirname, 'MEMBER_AREA_SCHEMA.sql'), 'utf8');

    // Dividir por declarações simples para evitar timeouts de transações longas
    // Nota: O bloco DO $$ não pode ser dividido pelo ponto e vírgula interno.
    const statements = sql.split('-- RLS')[0].split(';').filter(s => s.trim());
    const remaining = sql.split('-- RLS')[1];

    console.log(`Conectando ao banco de dados Supabase...`);
    await client.connect();
    console.log('Conectado com sucesso!');

    await client.query('SET statement_timeout = 120000'); // 120 segundos

    console.log('Aplicando tabelas e colunas...');
    for (const statement of statements) {
      if (!statement.trim()) continue;
      console.log(`Executando: ${statement.substring(0, 50).replace(/\n/g, ' ')}...`);
      await client.query(statement);
    }

    if (remaining) {
      console.log('Aplicando RLS e Policies...');
      // Aplicar o restante (RLS + Bloco DO $$) como um bloco único ou dividido por ;
      const rules = remaining.split(';').filter(r => r.trim());
      for (const rule of rules) {
        if (!rule.trim()) continue;
        // Se for o bloco DO $$, ele termina com END $$
        console.log(`Executando: ${rule.substring(0, 50).replace(/\n/g, ' ')}...`);
        await client.query(rule);
      }
    }

    console.log('ESQUEMA APLICADO COM SUCESSO!');

  } catch (err) {
    console.error('--- ERRO DURANTE A EXECUÇÃO ---');
    console.error('Mensagem:', err.message);
    if (err.detail) console.error('Detalhe:', err.detail);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMemberSchema();
