
-- Agent monthly goals
CREATE TABLE public.agent_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agente TEXT NOT NULL,
  mes TEXT NOT NULL, -- format YYYY-MM
  meta NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (agente, mes)
);

ALTER TABLE public.agent_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view agent_goals" ON public.agent_goals FOR SELECT USING (true);
CREATE POLICY "Anyone can insert agent_goals" ON public.agent_goals FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update agent_goals" ON public.agent_goals FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete agent_goals" ON public.agent_goals FOR DELETE USING (true);

-- Agent profiles (avatar)
CREATE TABLE public.agent_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agente TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view agent_profiles" ON public.agent_profiles FOR SELECT USING (true);
CREATE POLICY "Anyone can insert agent_profiles" ON public.agent_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update agent_profiles" ON public.agent_profiles FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete agent_profiles" ON public.agent_profiles FOR DELETE USING (true);

-- Storage bucket for agent avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('agent-avatars', 'agent-avatars', true);

CREATE POLICY "Anyone can view agent avatars" ON storage.objects FOR SELECT USING (bucket_id = 'agent-avatars');
CREATE POLICY "Anyone can upload agent avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'agent-avatars');
CREATE POLICY "Anyone can update agent avatars" ON storage.objects FOR UPDATE USING (bucket_id = 'agent-avatars');
CREATE POLICY "Anyone can delete agent avatars" ON storage.objects FOR DELETE USING (bucket_id = 'agent-avatars');
