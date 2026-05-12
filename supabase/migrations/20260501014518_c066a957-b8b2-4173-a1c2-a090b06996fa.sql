ALTER TABLE public.agent_investments
  ADD COLUMN IF NOT EXISTS leads_recibidos_60_second integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS leads_cerrados_60_second integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS leads_recibidos_fj_call integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS leads_cerrados_fj_call integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS leads_recibidos_leads_propios integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS leads_cerrados_leads_propios integer NOT NULL DEFAULT 0;