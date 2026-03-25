import { createClient } from '@supabase/supabase-js';

// Configurações extraídas do seu projeto
const supabaseUrl = 'https://hyjpxscsixeoibzhhtaf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5anB4c2NzaXhlb2liemhodGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzc3MTk3MiwiZXhwIjoyMDg5MzQ3OTcyfQ.mTineL1IKkuKua2hIfrQo4TuCjNzcWC31rx1NEGyXtI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createStudent(nome, email, password) {
  if (!nome || !email || !password) {
    console.error('Uso: node criar_aluno_terminal.js "Nome" "email@aluno.com" "senha123"');
    return;
  }

  console.log(`--- Iniciando criação de Aluno: ${nome} (${email}) ---`);
  
  // 1. Criar usuário no Auth
  console.log('1. Criando usuário no Supabase Auth...');
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nome }
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
      console.log('Aviso: Usuário já existe no Auth. Pulando para criação de perfil.');
      // Tentar pegar o ID do usuário existente
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const existing = users.find(u => u.email === email);
      if (existing) authData.user = existing;
    } else {
      throw authError;
    }
  }

  const userId = authData.user.id;
  console.log(`ID do Usuário: ${userId}`);

  // 2. Criar Perfil na tabela 'profiles'
  try {
    console.log('2. Criando perfil de aluno...');
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        nome: nome,
        email: email,
        status: 'ativo',
        onboarded: true
      });
    if (profileError) console.error('Aviso: Erro ao criar perfil:', profileError.message);
  } catch (e) {
    console.error('Aviso: Falha ao acessar tabela profiles.');
  }

  // 3. Atribuir Role 'user' (Aluno)
  try {
    console.log('3. Atribuindo role de Aluno...');
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({ user_id: userId, role: 'user' }, { onConflict: 'user_id,role' });
    if (roleError) console.error('Aviso: Erro ao atribuir role:', roleError.message);
  } catch (e) {
    console.error('Aviso: Falha ao acessar tabela user_roles.');
  }

  // 4. Inicializar Gamificação
  try {
    console.log('4. Inicializando gamificação (Level 1)...');
    const { error: gamificationError } = await supabase
      .from('gamification')
      .upsert({ user_id: userId, level: 1, xp: 0 });
    if (gamificationError) console.error('Aviso: Erro ao inicializar gamificação:', gamificationError.message);
  } catch (e) {
    console.error('Aviso: Falha ao acessar tabela gamification.');
  }

  console.log('\n✅ PROCESSO FINALIZADO!');
  console.log(`Login: ${email} / Senha: ${password}`);
  process.exit(0);
}

// Pega argumentos da linha de comando
const args = process.argv.slice(2);
if (args.length < 3) {
  console.error('Uso: node criar_aluno_terminal.js "Nome" "email@aluno.com" "senha123"');
  process.exit(1);
}

createStudent(args[0], args[1], args[2]).catch(err => {
  console.error('\n❌ ERRO FATAL:', err.message);
  process.exit(1);
});

