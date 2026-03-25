const SUPABASE_URL = 'https://hyjpxscsixeoibzhhtaf.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5anB4c2NzaXhlb2liemhodGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzc3MTk3MiwiZXhwIjoyMDg5MzQ3OTcyfQ.mTineL1IKkuKua2hIfrQo4TuCjNzcWC31rx1NEGyXtI';

async function verifyTables() {
  try {
    console.log('Verificando existência das tabelas via REST API...');
    const response = await fetch(`${SUPABASE_URL}/rest/v1/challenges?select=count`, {
      method: 'GET',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Range': '0-0'
      }
    });

    if (response.ok) {
        console.log('✅ Tabela "challenges" encontrada! SQL aplicado com sucesso.');
    } else {
        const errorText = await response.text();
        if (response.status === 404 || errorText.includes('does not exist')) {
            console.log('❌ Tabela "challenges" NÃO encontrada. O SQL ainda não foi aplicado.');
        } else {
            console.error('Erro ao verificar:', response.status, errorText);
        }
    }
  } catch (err) {
    console.error('ERRO de conexão:', err.message);
  }
}

verifyTables();
