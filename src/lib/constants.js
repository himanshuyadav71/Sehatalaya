export const PAGE_SIZE = 10;

export const PROVIDER_TYPES = ['doctor', 'lab', 'pharmacy'];

export const TYPE_ROUTES = {
  doctor: '/doctors',
  lab: '/labs',
  pharmacy: '/pharmacies',
};

// Organ / body-system groups used by the organ-based filter.
// Each specialty carries one organ_key.
export const ORGANS = [
  { key: 'general', en: 'General health', hi: 'सामान्य स्वास्थ्य', icon: '🩺' },
  { key: 'heart', en: 'Heart', hi: 'हृदय', icon: '❤️' },
  { key: 'brain', en: 'Brain & nerves', hi: 'मस्तिष्क एवं नसें', icon: '🧠' },
  { key: 'bones', en: 'Bones & joints', hi: 'हड्डी एवं जोड़', icon: '🦴' },
  { key: 'skin', en: 'Skin & hair', hi: 'त्वचा एवं बाल', icon: '🧴' },
  { key: 'eyes', en: 'Eyes', hi: 'आँखें', icon: '👁️' },
  { key: 'ent', en: 'Ear, nose & throat', hi: 'कान, नाक एवं गला', icon: '👂' },
  { key: 'teeth', en: 'Teeth & mouth', hi: 'दाँत एवं मुँह', icon: '🦷' },
  { key: 'kidney', en: 'Kidney & urinary', hi: 'किडनी एवं मूत्र मार्ग', icon: '💧' },
  { key: 'digestive', en: 'Stomach & digestion', hi: 'पेट एवं पाचन', icon: '🍽️' },
  { key: 'lungs', en: 'Lungs & chest', hi: 'फेफड़े एवं छाती', icon: '🫁' },
  { key: 'womens', en: "Women's health", hi: 'महिला स्वास्थ्य', icon: '🤰' },
  { key: 'children', en: "Children's health", hi: 'बाल स्वास्थ्य', icon: '🧒' },
  { key: 'mental', en: 'Mental health', hi: 'मानसिक स्वास्थ्य', icon: '💬' },
  { key: 'hormones', en: 'Diabetes & hormones', hi: 'मधुमेह एवं हार्मोन', icon: '🧪' },
  { key: 'cancer', en: 'Cancer care', hi: 'कैंसर देखभाल', icon: '🎗️' },
];

// Column order of the CSV import template. Keep in sync with
// docs/RESEARCH_WORKFLOW.md and scripts/csv-to-sql.mjs.
export const CSV_COLUMNS = [
  'type',
  'name',
  'name_hi',
  'specialty_slug',
  'qualifications',
  'experience_years',
  'registration_number',
  'registration_council',
  'clinic_name',
  'address',
  'area',
  'city',
  'state',
  'pincode',
  'phone',
  'maps_url',
  'website_url',
  'timings',
  'source_url',
  'source_checked_on',
  'source_notes',
];
