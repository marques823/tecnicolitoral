-- Verificar as políticas atuais da tabela technical_notes
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'technical_notes';