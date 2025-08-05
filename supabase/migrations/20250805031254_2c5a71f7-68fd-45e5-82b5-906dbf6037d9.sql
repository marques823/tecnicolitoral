-- Create policy to allow masters to update their own company
CREATE POLICY "Masters can update their own company"
ON public.companies
FOR UPDATE
USING (
  id = get_user_company_id(auth.uid()) 
  AND user_has_master_role(auth.uid())
)