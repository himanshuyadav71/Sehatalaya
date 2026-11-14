-- Sehatalay — set the public contact email shown to providers who want
-- to register, correct or remove a listing. Editable later from
-- Admin → Settings. Run once in the SQL Editor.
insert into public.site_settings (key, value)
values ('contact_email', '"hyadavmp41@gmail.com"'::jsonb)
on conflict (key) do update set value = excluded.value;
