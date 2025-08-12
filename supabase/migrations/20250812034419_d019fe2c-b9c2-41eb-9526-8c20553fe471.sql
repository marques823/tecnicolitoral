-- Make Basic plan free and remove Admin plan
begin;

-- Set Basic plan price to 0 (supporting common name variants)
update public.plans
set monthly_price = 0
where type::text = 'basic' or name in ('Básico','Basico','Basic');

-- Remove Admin/Internal plan entries by type or name
delete from public.plans
where type::text = 'admin' or lower(name) = 'plano admin';

commit;