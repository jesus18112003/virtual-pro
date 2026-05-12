-- Create polizas table
CREATE TABLE public.polizas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agente TEXT NOT NULL,
  monto NUMERIC NOT NULL,
  company TEXT NOT NULL DEFAULT '',
  fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.polizas ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read polizas (public scoreboard)
CREATE POLICY "Anyone can view polizas"
  ON public.polizas FOR SELECT
  USING (true);

-- Allow anyone to insert polizas
CREATE POLICY "Anyone can insert polizas"
  ON public.polizas FOR INSERT
  WITH CHECK (true);

-- Seed with sample data
INSERT INTO public.polizas (agente, monto, company, fecha) VALUES
  ('Alexander', 6000, 'AMERCO IUL UPPON ISSUE WI', '2025-03-01'),
  ('Alexander', 12500, 'NATIONWIDE TERM LIFE', '2025-03-03'),
  ('Maria', 4200, 'PACIFIC LIFE ANNUITY', '2025-03-02'),
  ('Maria', 8750, 'TRANSAMERICA UL POLICY', '2025-03-05'),
  ('Carlos', 3100, 'AMERCO IUL UPPON ISSUE WI', '2025-03-04'),
  ('Alexander', 15000, 'PRUDENTIAL WHOLE LIFE', '2025-03-07'),
  ('Carlos', 9200, 'LINCOLN NATIONAL VUL', '2025-03-06'),
  ('Jessica', 5500, 'METLIFE TERM POLICY', '2025-03-08'),
  ('Jessica', 22000, 'NEW YORK LIFE WHOLE', '2025-03-10'),
  ('Roberto', 7800, 'AMERCO IUL STANDARD', '2025-03-09'),
  ('Roberto', 11300, 'NATIONWIDE ANNUITY FIX', '2025-03-11'),
  ('Alexander', 4600, 'PACIFIC LIFE TERM', '2025-03-12'),
  ('Maria', 18500, 'TRANSAMERICA WHOLE LIFE', '2025-03-14'),
  ('Carlos', 6700, 'PRUDENTIAL TERM 20YR', '2025-03-13'),
  ('Jessica', 9900, 'LINCOLN NATIONAL IUL', '2025-03-15'),
  ('Roberto', 3400, 'METLIFE UNIVERSAL LIFE', '2025-03-16'),
  ('Alexander', 14200, 'NEW YORK LIFE ANNUITY', '2025-03-18'),
  ('Maria', 8100, 'AMERCO WHOLE LIFE STD', '2025-03-17'),
  ('Carlos', 5300, 'NATIONWIDE UL PREMIUM', '2025-03-19'),
  ('Jessica', 19700, 'PACIFIC LIFE WHOLE', '2025-03-20'),
  ('Roberto', 2800, 'TRANSAMERICA TERM 10YR', '2025-03-21'),
  ('Alexander', 16400, 'PRUDENTIAL IUL ELITE', '2025-03-22'),
  ('Maria', 7200, 'LINCOLN NATIONAL TERM', '2025-03-23'),
  ('Carlos', 10800, 'METLIFE WHOLE STANDARD', '2025-03-24'),
  ('Jessica', 4900, 'NEW YORK LIFE TERM', '2025-03-25'),
  ('Roberto', 13600, 'AMERCO ANNUITY FIXED', '2025-02-15'),
  ('Alexander', 8400, 'NATIONWIDE WHOLE LIFE', '2025-02-18'),
  ('Maria', 6100, 'PACIFIC LIFE IUL', '2025-02-20'),
  ('Carlos', 21000, 'TRANSAMERICA VUL PREM', '2025-02-22'),
  ('Jessica', 3700, 'PRUDENTIAL TERM 30YR', '2025-02-25');