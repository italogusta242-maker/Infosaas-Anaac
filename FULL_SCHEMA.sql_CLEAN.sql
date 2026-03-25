-- ============================================================
-- SCHEMA CLEANUP & IDEMPOTENCY PREAMBLE
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "unaccent" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_cron" SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS "pg_net" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "vector" SCHEMA extensions;

-- Enum para roles (Consolidado)
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'especialista', 'user', 'closer', 'cs', 'nutricionista', 'personal');
EXCEPTION
    WHEN duplicate_object THEN 
        ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'closer';
        ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cs';
        ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'nutricionista';
        ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'personal';
END $$;

-- Enums legados
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'classe_type') THEN
        CREATE TYPE public.classe_type AS ENUM ('gladius', 'velite', 'centurio');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'league_type') THEN
        CREATE TYPE public.league_type AS ENUM ('plebe', 'legionario', 'centuriao', 'pretoriano');
    END IF;
END $$;

-- ============================================================
-- CORE TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT,
  email TEXT,
  telefone TEXT,
  nascimento TEXT,
  cpf TEXT,
  cidade_estado TEXT,
  sexo TEXT,
  faixa_etaria TEXT,
  altura TEXT,
  peso TEXT,
  meta_peso TEXT,
  como_chegou TEXT,
  cep TEXT,
  logradouro TEXT,
  bairro TEXT,
  onboarded BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pendente_onboarding',
  avatar_url TEXT,
  notification_preview TEXT NOT NULL DEFAULT 'full',
  body_fat NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS public.student_specialists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  specialist_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  specialty TEXT NOT NULL CHECK (specialty IN ('preparador', 'nutricionista', 'psicologo', 'personal')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, specialist_id)
);

CREATE TABLE IF NOT EXISTS public.invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  email text NOT NULL,
  name text,
  cpf text,
  plan_value numeric,
  status text NOT NULL DEFAULT 'pending',
  created_by uuid,
  used_at timestamp with time zone,
  expires_at timestamp with time zone DEFAULT (now() + interval '7 days'),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  product_id UUID,
  payment_status TEXT DEFAULT 'pending',
  invoice_url TEXT,
  email_opened_at timestamptz,
  payment_link_clicked_at timestamptz
);

-- ============================================================
-- GAMIFICATION & HABITS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.gamification (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  streak INTEGER NOT NULL DEFAULT 0,
  max_streak INTEGER NOT NULL DEFAULT 0,
  dracmas INTEGER NOT NULL DEFAULT 0,
  flame_percent INTEGER NOT NULL DEFAULT 0,
  truce_days INTEGER NOT NULL DEFAULT 0,
  last_training_date DATE DEFAULT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.daily_habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  water_liters NUMERIC NOT NULL DEFAULT 0,
  completed_meals TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

-- ============================================================
-- TRAINING & WORKOUTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.training_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  specialist_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Plano Personalizado',
  groups JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_sessions INTEGER NOT NULL DEFAULT 50,
  valid_until DATE,
  active BOOLEAN NOT NULL DEFAULT true,
  avaliacao_postural TEXT,
  pontos_melhoria TEXT,
  objetivo_mesociclo TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.training_plans(id) ON DELETE SET NULL,
  group_name TEXT,
  effort_rating INTEGER,
  comment TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  exercises JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.exercise_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  muscle_group text NOT NULL,
  default_sets integer NOT NULL DEFAULT 3,
  default_reps text NOT NULL DEFAULT '10',
  video_id text,
  gif_url text,
  instructions text,
  equipment text,
  level text,
  secondary_muscles text,
  category text,
  movement_pattern text,
  external_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ============================================================
-- NUTRITION
-- ============================================================

CREATE TABLE IF NOT EXISTS public.diet_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  specialist_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Plano Alimentar',
  meals JSONB NOT NULL DEFAULT '[]'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  goal TEXT NOT NULL DEFAULT 'manutenção',
  goal_description TEXT,
  valid_until DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.food_database (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  portion text NOT NULL DEFAULT '100g',
  calories numeric NOT NULL DEFAULT 0,
  protein numeric NOT NULL DEFAULT 0,
  carbs numeric NOT NULL DEFAULT 0,
  fat numeric NOT NULL DEFAULT 0,
  fiber numeric DEFAULT 0,
  category text NOT NULL DEFAULT 'outros',
  fonte TEXT DEFAULT 'TBCA',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- MANAGEMENT & METRICS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_price numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  started_at timestamptz NOT NULL DEFAULT now(),
  canceled_at timestamptz,
  cancel_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.metric_goals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_key text NOT NULL UNIQUE,
  goal_value numeric NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid
);

-- ============================================================
-- APP FUNCTIONS (SECURITY DEFINER)
-- ============================================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'name', NULL),
    'pendente_onboarding'
  ) ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- ============================================================
-- SECURITY POLICIES (DYNAMIC CLEANUP)
-- ============================================================

-- Grouped DROP & CREATE
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.tablename);
    END LOOP;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins manage profiles" ON public.profiles FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "System insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);

ALTER TABLE public.training_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own training" ON public.training_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Specialists manage training" ON public.training_plans FOR ALL USING (public.has_role(auth.uid(), 'especialista'::app_role) OR public.has_role(auth.uid(), 'personal'::app_role));

ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage invites" ON public.invites FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Closers manage own invites" ON public.invites FOR ALL USING (public.has_role(auth.uid(), 'closer'::app_role) AND created_by = auth.uid());

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-media', 'chat-media', true) ON CONFLICT (id) DO NOTHING;

-- Storage Policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "Avatars are public" ON storage.objects;
    DROP POLICY IF EXISTS "Users upload avatar" ON storage.objects;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE POLICY "Avatars are public" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- TRIGGERS
-- ============================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- FINAL REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_habits;
ALTER PUBLICATION supabase_realtime ADD TABLE public.workouts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.invites;
