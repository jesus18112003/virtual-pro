
-- Tabla de equipos
CREATE TABLE public.equipos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.equipos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view equipos" ON public.equipos FOR SELECT USING (true);
CREATE POLICY "Anyone can insert equipos" ON public.equipos FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update equipos" ON public.equipos FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete equipos" ON public.equipos FOR DELETE USING (true);

-- Tabla de asignación agente -> equipo (un agente pertenece a 1 equipo)
CREATE TABLE public.agent_teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agente TEXT NOT NULL UNIQUE,
  equipo_id UUID NOT NULL REFERENCES public.equipos(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view agent_teams" ON public.agent_teams FOR SELECT USING (true);
CREATE POLICY "Anyone can insert agent_teams" ON public.agent_teams FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update agent_teams" ON public.agent_teams FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete agent_teams" ON public.agent_teams FOR DELETE USING (true);

-- Tabla de metas por equipo y mes
CREATE TABLE public.team_metas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipo_id UUID NOT NULL REFERENCES public.equipos(id) ON DELETE CASCADE,
  mes TEXT NOT NULL,
  meta NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(equipo_id, mes)
);

ALTER TABLE public.team_metas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view team_metas" ON public.team_metas FOR SELECT USING (true);
CREATE POLICY "Anyone can insert team_metas" ON public.team_metas FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update team_metas" ON public.team_metas FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete team_metas" ON public.team_metas FOR DELETE USING (true);
