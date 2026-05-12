
CREATE TABLE public.team_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mes TEXT NOT NULL UNIQUE,
  meta NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.team_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view team_goals" ON public.team_goals FOR SELECT USING (true);
CREATE POLICY "Anyone can insert team_goals" ON public.team_goals FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update team_goals" ON public.team_goals FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete team_goals" ON public.team_goals FOR DELETE USING (true);
