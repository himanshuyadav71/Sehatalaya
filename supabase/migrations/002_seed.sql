-- =====================================================================
-- Sehatalay — reference data (specialties + default settings).
-- Contains NO provider records. Providers are added only by the owner,
-- as drafts, through the admin dashboard or the CSV importer.
-- =====================================================================

insert into public.specialties (slug, name_en, name_hi, organ_key, sort_order) values
  ('general-physician',  'General Physician',                    'सामान्य चिकित्सक',                 'general',   10),
  ('internal-medicine',  'Physician (Internal Medicine)',        'मेडिसिन विशेषज्ञ (फिजिशियन)',      'general',   15),
  ('general-surgeon',    'General Surgeon',                     'सामान्य सर्जन',                    'general',   20),
  ('cardiologist',       'Cardiologist',                         'हृदय रोग विशेषज्ञ',                'heart',     30),
  ('neurologist',        'Neurologist',                          'तंत्रिका रोग विशेषज्ञ',            'brain',     40),
  ('neurosurgeon',       'Neurosurgeon',                         'न्यूरोसर्जन',                      'brain',     50),
  ('orthopedic',         'Orthopaedic Surgeon',                  'हड्डी रोग विशेषज्ञ',               'bones',     60),
  ('physiotherapist',    'Physiotherapist',                      'फिजियोथेरेपिस्ट',                  'bones',     70),
  ('dermatologist',      'Dermatologist',                        'त्वचा रोग विशेषज्ञ',               'skin',      80),
  ('ophthalmologist',    'Ophthalmologist (Eye Specialist)',     'नेत्र रोग विशेषज्ञ',               'eyes',      90),
  ('ent',                'ENT Specialist',                       'नाक-कान-गला रोग विशेषज्ञ',         'ent',      100),
  ('dentist',            'Dentist',                              'दंत चिकित्सक',                     'teeth',    110),
  ('nephrologist',       'Nephrologist',                         'किडनी रोग विशेषज्ञ',               'kidney',   120),
  ('urologist',          'Urologist',                            'मूत्र रोग विशेषज्ञ',               'kidney',   130),
  ('gastroenterologist', 'Gastroenterologist',                   'पेट एवं पाचन रोग विशेषज्ञ',        'digestive',140),
  ('pulmonologist',      'Pulmonologist (Chest Specialist)',     'छाती एवं श्वास रोग विशेषज्ञ',      'lungs',    150),
  ('gynecologist',       'Obstetrician & Gynaecologist',         'स्त्री एवं प्रसूति रोग विशेषज्ञ',  'womens',   160),
  ('pediatrician',       'Paediatrician',                        'शिशु रोग विशेषज्ञ',                'children', 170),
  ('psychiatrist',       'Psychiatrist',                         'मनोरोग विशेषज्ञ',                  'mental',   180),
  ('endocrinologist',    'Endocrinologist (Diabetes & Thyroid)', 'मधुमेह एवं थायरॉइड विशेषज्ञ',      'hormones', 190),
  ('oncologist',         'Oncologist',                           'कैंसर रोग विशेषज्ञ',               'cancer',   200),
  ('radiologist',       'Radiologist',                          'रेडियोलॉजिस्ट',                    'general',  205),
  ('ayurveda',           'Ayurveda Practitioner',                'आयुर्वेद चिकित्सक',                'general',  210),
  ('homeopathy',         'Homoeopathy Practitioner',             'होम्योपैथी चिकित्सक',              'general',  220)
on conflict (slug) do nothing;

insert into public.site_settings (key, value) values
  ('announcement_en', '""'::jsonb),
  ('announcement_hi', '""'::jsonb),
  ('contact_email',   '""'::jsonb),
  -- Google AdSense stays OFF until the owner has approval and enables it
  -- from Admin → Settings.
  ('adsense_enabled', 'false'::jsonb),
  ('adsense_client',  '""'::jsonb)
on conflict (key) do nothing;
