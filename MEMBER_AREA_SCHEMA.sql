-- Novos Desafios e Áreas de Membros
-- ANAAC. (Ivory/Fuchsia Logo)

-- Desafios (ex: "Desafio 30 Dias", "Desafio Verão")
CREATE TABLE IF NOT EXISTS challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  banner_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Módulos dentro de um desafio
CREATE TABLE IF NOT EXISTS challenge_modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'BookOpen',
  sort_order INT DEFAULT 0,
  type TEXT DEFAULT 'lessons', -- lessons, diets, workouts, community
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Aulas dentro de um módulo
CREATE TABLE IF NOT EXISTS challenge_lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID REFERENCES challenge_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  duration TEXT, -- "12:45"
  sort_order INT DEFAULT 0,
  is_free BOOLEAN DEFAULT false,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Progresso do aluno nas aulas
CREATE TABLE IF NOT EXISTS lesson_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES challenge_lessons(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'not_started', -- not_started, in_progress, completed
  watch_time_seconds INT DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Comentários nas aulas
CREATE TABLE IF NOT EXISTS lesson_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID REFERENCES challenge_lessons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Banners da área de membros
CREATE TABLE IF NOT EXISTS challenge_banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  title_top TEXT,
  title_main TEXT NOT NULL,
  subtitle TEXT,
  cta_text TEXT,
  cta_link TEXT,
  image_url TEXT,
  features JSONB DEFAULT '[]',
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_banners ENABLE ROW LEVEL SECURITY;

-- Policies: leitura para todos autenticados, escrita apenas admin
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'read_challenges') THEN
        CREATE POLICY "read_challenges" ON challenges FOR SELECT TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_challenges') THEN
        CREATE POLICY "admin_challenges" ON challenges FOR ALL TO authenticated USING (
          EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'especialista'))
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'read_modules') THEN
        CREATE POLICY "read_modules" ON challenge_modules FOR SELECT TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_modules') THEN
        CREATE POLICY "admin_modules" ON challenge_modules FOR ALL TO authenticated USING (
          EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'especialista'))
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'read_lessons') THEN
        CREATE POLICY "read_lessons" ON challenge_lessons FOR SELECT TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_lessons') THEN
        CREATE POLICY "admin_lessons" ON challenge_lessons FOR ALL TO authenticated USING (
          EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'especialista'))
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'own_progress') THEN
        CREATE POLICY "own_progress" ON lesson_progress FOR ALL TO authenticated USING (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'read_comments') THEN
        CREATE POLICY "read_comments" ON lesson_comments FOR SELECT TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'insert_own_comments') THEN
        CREATE POLICY "insert_own_comments" ON lesson_comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'read_banners') THEN
        CREATE POLICY "read_banners" ON challenge_banners FOR SELECT TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_banners') THEN
        CREATE POLICY "admin_banners" ON challenge_banners FOR ALL TO authenticated USING (
          EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'especialista'))
        );
    END IF;
END $$;
