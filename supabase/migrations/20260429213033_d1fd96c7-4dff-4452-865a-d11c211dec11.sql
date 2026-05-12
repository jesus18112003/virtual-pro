-- Tabla para registrar inversión semanal por agente y fuente
CREATE TABLE public.agent_investments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agente TEXT NOT NULL,
  semana DATE NOT NULL, -- lunes (start) de la semana a la que pertenece la inversión
  inv_60_second NUMERIC NOT NULL DEFAULT 0,
  inv_fj_call NUMERIC NOT NULL DEFAULT 0,
  inv_leads_propios NUMERIC NOT NULL DEFAULT 0,
  leads_recibidos INTEGER NOT NULL DEFAULT 0,
  leads_cerrados INTEGER NOT NULL DEFAULT 0,
  pct_cierre_60_second NUMERIC NOT NULL DEFAULT 0,
  pct_cierre_fj_call NUMERIC NOT NULL DEFAULT 0,
  pct_cierre_leads_propios NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_investments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view agent_investments"
  ON public.agent_investments FOR SELECT USING (true);
CREATE POLICY "Anyone can insert agent_investments"
  ON public.agent_investments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update agent_investments"
  ON public.agent_investments FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete agent_investments"
  ON public.agent_investments FOR DELETE USING (true);

CREATE INDEX idx_agent_investments_agente_semana ON public.agent_investments(agente, semana);