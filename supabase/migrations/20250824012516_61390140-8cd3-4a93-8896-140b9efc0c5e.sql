-- Add new columns to technical_notes table for enhanced functionality
ALTER TABLE public.technical_notes 
ADD COLUMN devices_info JSONB,
ADD COLUMN services_performed TEXT[],
ADD COLUMN services_needed TEXT[],
ADD COLUMN photos TEXT[],
ADD COLUMN equipment_models TEXT[],
ADD COLUMN problem_description TEXT,
ADD COLUMN solution_description TEXT,
ADD COLUMN observations TEXT;

-- Create storage bucket for technical note photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('technical-notes', 'technical-notes', false);

-- Create policies for technical notes photos
CREATE POLICY "Users can view photos from their company technical notes"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'technical-notes' 
  AND EXISTS (
    SELECT 1 FROM technical_notes tn
    WHERE tn.id::text = (storage.foldername(name))[1]
    AND tn.company_id = get_user_company_id(auth.uid())
  )
);

CREATE POLICY "Users can upload photos to their company technical notes"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'technical-notes'
  AND EXISTS (
    SELECT 1 FROM technical_notes tn
    WHERE tn.id::text = (storage.foldername(name))[1]
    AND tn.company_id = get_user_company_id(auth.uid())
  )
);

CREATE POLICY "Users can update photos in their company technical notes"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'technical-notes'
  AND EXISTS (
    SELECT 1 FROM technical_notes tn
    WHERE tn.id::text = (storage.foldername(name))[1]
    AND tn.company_id = get_user_company_id(auth.uid())
  )
);

CREATE POLICY "Users can delete photos from their company technical notes"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'technical-notes'
  AND EXISTS (
    SELECT 1 FROM technical_notes tn
    WHERE tn.id::text = (storage.foldername(name))[1]
    AND tn.company_id = get_user_company_id(auth.uid())
  )
);