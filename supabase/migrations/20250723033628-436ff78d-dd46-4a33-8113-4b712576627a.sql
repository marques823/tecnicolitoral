-- Criar enum para tipos de campos personalizados
CREATE TYPE custom_field_type AS ENUM ('text', 'textarea', 'select', 'number', 'date', 'boolean');

-- Tabela para definir campos personalizados por empresa
CREATE TABLE public.custom_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  field_type custom_field_type NOT NULL,
  options JSONB, -- Para campos select, armazena as opções
  required BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para armazenar valores dos campos personalizados
CREATE TABLE public.custom_field_values (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL,
  custom_field_id UUID NOT NULL,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(ticket_id, custom_field_id)
);

-- Habilitar RLS
ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_field_values ENABLE ROW LEVEL SECURITY;

-- Políticas para custom_fields
CREATE POLICY "Users can view custom fields from their company" 
ON public.custom_fields 
FOR SELECT 
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Masters can manage custom fields for their company" 
ON public.custom_fields 
FOR ALL 
USING (company_id = get_user_company_id(auth.uid()) AND user_has_master_role(auth.uid()))
WITH CHECK (company_id = get_user_company_id(auth.uid()) AND user_has_master_role(auth.uid()));

-- Políticas para custom_field_values
CREATE POLICY "Users can view custom field values from their company" 
ON public.custom_field_values 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM tickets t 
  WHERE t.id = custom_field_values.ticket_id 
  AND t.company_id = get_user_company_id(auth.uid())
));

CREATE POLICY "Users can insert custom field values for their company tickets" 
ON public.custom_field_values 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM tickets t 
  WHERE t.id = custom_field_values.ticket_id 
  AND t.company_id = get_user_company_id(auth.uid())
));

CREATE POLICY "Users can update custom field values for their company tickets" 
ON public.custom_field_values 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM tickets t 
  WHERE t.id = custom_field_values.ticket_id 
  AND t.company_id = get_user_company_id(auth.uid())
));

-- Triggers para updated_at
CREATE TRIGGER update_custom_fields_updated_at
BEFORE UPDATE ON public.custom_fields
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_custom_field_values_updated_at
BEFORE UPDATE ON public.custom_field_values
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar foreign keys
ALTER TABLE public.custom_fields 
ADD CONSTRAINT custom_fields_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.custom_field_values 
ADD CONSTRAINT custom_field_values_ticket_id_fkey 
FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE;

ALTER TABLE public.custom_field_values 
ADD CONSTRAINT custom_field_values_custom_field_id_fkey 
FOREIGN KEY (custom_field_id) REFERENCES public.custom_fields(id) ON DELETE CASCADE;