-- Enable RLS on the remaining table
ALTER TABLE public.n8n_chat_histories ENABLE ROW LEVEL SECURITY;

-- Create a policy for the n8n table (this seems to be a pre-existing table)
-- Since it's n8n related, we'll make it accessible only to authenticated users
CREATE POLICY "Authenticated users can access chat histories" ON public.n8n_chat_histories
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);