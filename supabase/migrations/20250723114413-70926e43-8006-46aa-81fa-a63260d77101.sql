-- Verificar se existe plano e criar se necessário
INSERT INTO plans (name, type, max_users, has_custom_fields, monthly_price) 
VALUES ('Plano Admin', 'enterprise', 1000, true, 0)
ON CONFLICT DO NOTHING;

-- Criar empresa para o super admin
DO $$
DECLARE
    admin_plan_id uuid;
    admin_company_id uuid;
BEGIN
    -- Buscar plano
    SELECT id INTO admin_plan_id FROM plans LIMIT 1;
    
    -- Criar empresa se não existir
    INSERT INTO companies (name, plan_id, active) 
    VALUES ('TicketFlow Admin Company', admin_plan_id, true)
    ON CONFLICT DO NOTHING
    RETURNING id INTO admin_company_id;
    
    -- Se não retornou ID, buscar empresa existente
    IF admin_company_id IS NULL THEN
        SELECT id INTO admin_company_id FROM companies LIMIT 1;
    END IF;
END $$;