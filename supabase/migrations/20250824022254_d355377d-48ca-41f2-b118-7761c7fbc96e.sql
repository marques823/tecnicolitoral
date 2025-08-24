-- Adicionar política DELETE para permitir que usuários excluam suas próprias notas técnicas
CREATE POLICY "Users can delete their own technical notes" 
ON public.technical_notes 
FOR DELETE 
USING (created_by = auth.uid());