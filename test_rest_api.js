const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const SUPABASE_URL = 'https://hyjpxscsixeoibzhhtaf.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5anB4c2NzaXhlb2liemhodGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzc3MTk3MiwiZXhwIjoyMDg5MzQ3OTcyfQ.mTineL1IKkuKua2hIfrQo4TuCjNzcWC31rx1NEGyXtI';

async function checkRest() {
  try {
    console.log('Testando REST API com Service Role Key...');
    const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=count`, {
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      }
    });

    if (response.ok) {
        const data = await response.json();
        console.log('Conexão REST OK! Total de perfis (head):', data);
    } else {
        console.error('Erro na REST API:', response.status, await response.text());
    }
  } catch (err) {
    console.error('ERRO:', err.message);
  }
}

checkRest();
