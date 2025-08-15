-- Fix security vulnerability in n8n_chat_histories table
-- Add user_id column to track session ownership
ALTER TABLE public.n8n_chat_histories 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing records to set user_id (for migration purposes, we'll leave them null for now)
-- In production, you'd need to map existing sessions to users based on your business logic

-- Drop the insecure policy
DROP POLICY IF EXISTS "Authenticated users can access chat histories" ON public.n8n_chat_histories;

-- Create secure policies
-- Users can only view their own chat histories
CREATE POLICY "Users can view their own chat histories" 
ON public.n8n_chat_histories 
FOR SELECT 
USING (user_id = auth.uid());

-- Users can only create chat histories for themselves
CREATE POLICY "Users can create their own chat histories" 
ON public.n8n_chat_histories 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Users can only update their own chat histories
CREATE POLICY "Users can update their own chat histories" 
ON public.n8n_chat_histories 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can only delete their own chat histories
CREATE POLICY "Users can delete their own chat histories" 
ON public.n8n_chat_histories 
FOR DELETE 
USING (user_id = auth.uid());

-- Super admins can access all chat histories for support purposes
CREATE POLICY "Super admins can access all chat histories" 
ON public.n8n_chat_histories 
FOR ALL 
USING (user_is_super_admin(auth.uid()))
WITH CHECK (user_is_super_admin(auth.uid()));

-- Masters can access chat histories from their company users
CREATE POLICY "Masters can access company chat histories" 
ON public.n8n_chat_histories 
FOR SELECT 
USING (
  user_has_master_role(auth.uid()) AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = n8n_chat_histories.user_id 
    AND profiles.company_id = get_user_company_id(auth.uid())
  )
);