-- اختياري: شغّل هذا فقط بعد أخذ نسخة احتياطية إذا كانت لديك تواريخ قديمة غير منطقية.
-- ملاحظة: PostgreSQL date لا يقبل تواريخ غير صالحة تركيبياً، لكن قد توجد تواريخ صحيحة تركيبياً وغير منطقية مثل سنة 1002.
update public.clients
set start_date = null
where start_date is not null and (extract(year from start_date) < 1900 or extract(year from start_date) > 2100);

update public.clients
set end_date = null
where end_date is not null and (extract(year from end_date) < 1900 or extract(year from end_date) > 2100);

update public.tasks
set due_date = null
where due_date is not null and (extract(year from due_date) < 1900 or extract(year from due_date) > 2100);

update public.financial_transactions
set transaction_date = current_date
where transaction_date is null or extract(year from transaction_date) < 1900 or extract(year from transaction_date) > 2100;

update public.appointments
set appointment_date = current_date
where appointment_date is null or extract(year from appointment_date) < 1900 or extract(year from appointment_date) > 2100;
