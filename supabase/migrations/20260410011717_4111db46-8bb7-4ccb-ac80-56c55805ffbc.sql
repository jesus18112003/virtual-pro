ALTER TABLE public.agentes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view agentes" ON public.agentes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert agentes" ON public.agentes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update agentes" ON public.agentes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete agentes" ON public.agentes FOR DELETE USING (true);