CREATE TABLE public.investment_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mes TEXT NOT NULL UNIQUE,
  meta NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.investment_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view investment_goals" ON public.investment_goals FOR SELECT USING (true);
CREATE POLICY "Anyone can insert investment_goals" ON public.investment_goals FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update investment_goals" ON public.investment_goals FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete investment_goals" ON public.investment_goals FOR DELETE USING (true);