
-- Add new columns to polizas
ALTER TABLE public.polizas ADD COLUMN empresa text;
ALTER TABLE public.polizas ADD COLUMN tipo_poliza text;
ALTER TABLE public.polizas ADD COLUMN forma_pago text;
ALTER TABLE public.polizas ADD COLUMN cliente text;

-- Table to track Discord sync state
CREATE TABLE public.discord_sync_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id text NOT NULL UNIQUE,
  last_message_id text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.discord_sync_state ENABLE ROW LEVEL SECURITY;

-- Allow edge functions (service role) to manage this table
CREATE POLICY "Service role can manage discord_sync_state"
ON public.discord_sync_state
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
