-- Criar bucket para logotipos das empresas
INSERT INTO storage.buckets (id, name, public) 
VALUES ('company-logos', 'company-logos', true);

-- Políticas de storage para logotipos
CREATE POLICY "Todos podem visualizar logotipos da empresa" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'company-logos');

CREATE POLICY "Masters podem fazer upload de logotipos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'company-logos' 
  AND user_has_master_role(auth.uid())
  AND (storage.foldername(name))[1] = get_user_company_id(auth.uid())::text
);

CREATE POLICY "Masters podem atualizar logotipos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'company-logos' 
  AND user_has_master_role(auth.uid())
  AND (storage.foldername(name))[1] = get_user_company_id(auth.uid())::text
);

CREATE POLICY "Masters podem deletar logotipos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'company-logos' 
  AND user_has_master_role(auth.uid())
  AND (storage.foldername(name))[1] = get_user_company_id(auth.uid())::text
);

-- Adicionar campos de personalização na tabela companies
ALTER TABLE companies ADD COLUMN logo_url TEXT;
ALTER TABLE companies ADD COLUMN primary_color TEXT DEFAULT '#2563eb';
ALTER TABLE companies ADD COLUMN secondary_color TEXT DEFAULT '#64748b';
ALTER TABLE companies ADD COLUMN custom_css TEXT;