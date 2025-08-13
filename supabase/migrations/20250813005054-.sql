-- Verificar se a empresa TicketFlow Admin existe, se não existir, criar ela
INSERT INTO public.companies (name, plan_id, active)
SELECT 'TicketFlow Admin', 
       (SELECT id FROM public.plans WHERE name = 'Admin' LIMIT 1), 
       true
WHERE NOT EXISTS (
  SELECT 1 FROM public.companies WHERE name = 'TicketFlow Admin'
);