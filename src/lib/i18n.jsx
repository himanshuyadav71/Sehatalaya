import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STRINGS = {
  en: {
    brand: 'Sehatalay',
    tagline: 'Sehat Ka Ghar',
    city: 'Dewas, Madhya Pradesh',
    na: 'N/A',

    'nav.home': 'Home',
    'nav.doctors': 'Doctors',
    'nav.labs': 'Labs',
    'nav.pharmacies': 'Pharmacies',
    'nav.about': 'About',
    'nav.menu': 'Menu',
    'lang.switch': 'हिन्दी',
    'lang.switchLabel': 'Switch language to Hindi',
    'theme.dark': 'Dark',
    'theme.light': 'Light',
    'theme.toDark': 'Switch to dark mode',
    'theme.toLight': 'Switch to light mode',

    'home.title': 'Find doctors, labs and pharmacies in Dewas',
    'home.subtitle':
      'A free, neutral healthcare directory for Dewas. Every listing is reviewed by our team before it is published.',
    'home.searchPlaceholder': 'Search by doctor name, area or specialization',
    'home.search': 'Search',
    'home.browseOrgan': 'Browse doctors by health concern',
    'home.categories': 'What are you looking for?',
    'home.doctorsDesc': 'Doctors and clinics, by specialty and area',
    'home.labsDesc': 'Diagnostic and pathology laboratories',
    'home.pharmaciesDesc': 'Medical stores and pharmacies',
    'home.principles': 'How Sehatalay works',
    'home.p1.title': 'Reviewed before publishing',
    'home.p1.body':
      'Listings are researched from public sources and approved by the owner before they appear. Unconfirmed details are shown as N/A.',
    'home.p2.title': 'Neutral listing order',
    'home.p2.body':
      'No paid rankings and no "top doctor" lists. Listings are sorted alphabetically and you choose the filters.',
    'home.p3.title': 'No invented ratings',
    'home.p3.body':
      'We do not publish made-up reviews or star ratings. A "Verified" badge appears only after registration details are checked.',
    'home.p4.title': 'Free for providers',
    'home.p4.body': 'All provider listings are free at launch.',

    'dir.doctors.title': 'Doctors in Dewas',
    'dir.labs.title': 'Diagnostic labs in Dewas',
    'dir.pharmacies.title': 'Pharmacies and medical stores in Dewas',
    'dir.searchDoctors': 'Search by name, area or specialization',
    'dir.searchOther': 'Search by name or area',
    'dir.specialty': 'Specialty',
    'dir.allSpecialties': 'All specialties',
    'dir.organ': 'Health concern',
    'dir.allOrgans': 'All health concerns',
    'dir.area': 'Area',
    'dir.allAreas': 'All areas',
    'dir.sort': 'Sort',
    'dir.sort.nameAsc': 'Name (A–Z)',
    'dir.sort.nameDesc': 'Name (Z–A)',
    'dir.sort.area': 'Area (A–Z)',
    'dir.clear': 'Clear filters',
    'dir.results': '{count} listing(s)',
    'dir.showing': 'Showing {from}–{to} of {count}',
    'dir.empty.title': 'No published listings yet',
    'dir.empty.body':
      'Listings appear here only after they have been researched and approved. Please check back soon.',
    'dir.emptyFiltered.title': 'No listings match your search',
    'dir.emptyFiltered.body': 'Try a different name, area or filter.',
    'dir.neutral':
      'Listings are shown in alphabetical order. Sehatalay does not rank providers and does not accept payment for placement.',
    'dir.error': 'Listings could not be loaded. Please try again.',
    'dir.loading': 'Loading listings…',

    'page.prev': 'Previous',
    'page.next': 'Next',
    'page.page': 'Page {n}',
    'page.nav': 'Pagination',

    'card.view': 'View details',
    'card.verified': 'Verified',
    'card.verifiedTitle': 'Registration details checked by Sehatalay',
    'card.experience': '{n} years experience',

    'field.specialty': 'Specialty',
    'field.qualifications': 'Qualifications',
    'field.experience': 'Experience',
    'field.experienceYears': '{n} years',
    'field.registration': 'Registration number',
    'field.council': 'Registration council',
    'field.regVerified': 'Registration verified',
    'field.regNotVerified': 'Not yet verified',
    'field.clinic': 'Clinic / hospital',
    'field.address': 'Address',
    'field.area': 'Area',
    'field.timings': 'Timings',
    'field.website': 'Website',
    'field.verifiedPhone': 'Verified contact number',
    'field.phoneUnverified': 'Contact number (not yet verified)',
    'field.phoneNone': 'Contact number: N/A',
    'field.phoneUnverifiedNote': 'This number was found in public sources and has not yet been confirmed by Sehatalay.',
    'field.maps': 'Open Google Maps listing',
    'field.mapsSearch': 'Search this address on Google Maps',
    'field.updated': 'Listing last updated',

    'detail.back': 'Back to list',
    'detail.notFound': 'This listing is not available.',
    'detail.contact': 'Contact',
    'detail.details': 'Details',
    'detail.location': 'Location',
    'detail.disclaimer':
      'Information is compiled from public sources and provider confirmation. Please confirm timings and availability directly with the provider. Sehatalay does not provide medical advice.',
    'detail.report': 'See something incorrect? Tell us so we can fix it.',

    'action.chat': 'Chat',
    'action.call': 'Call',
    'action.close': 'Close',
    'modal.chat.title': 'Messaging — Coming Soon',
    'modal.chat.alt': 'चैट सुविधा — जल्द आ रही है',
    'modal.chat.body':
      'In-app messaging with providers is not available yet. We are working on it.',
    'modal.call.title': 'Voice Connect — In Development',
    'modal.call.alt': 'वॉइस कनेक्ट — विकास में है',
    'modal.call.body':
      'In-app calling is not available yet. If a verified contact number is available for this provider, it is shown on the listing.',

    'about.title': 'About Sehatalay',
    'about.meaning': 'Sehatalay (सेहतालय) means "Sehat Ka Ghar" — the home of health.',
    'about.body1':
      'Sehatalay is a free healthcare directory that starts with Dewas, Madhya Pradesh. It helps residents find doctors, diagnostic laboratories and pharmacies near them, in Hindi and English.',
    'about.body2':
      'Listings are researched from publicly available, permitted sources such as official websites and registration directories, and from direct confirmation by the provider. Nothing is published automatically: every listing is reviewed and approved by the owner first.',
    'about.body3':
      'Where information could not be confirmed, we show "N/A" rather than guess. We never publish invented doctors, businesses, ratings or reviews.',
    'about.providers': 'For doctors, labs and pharmacies',
    'about.providersBody':
      'Listings are free at launch. To add or correct your listing, or to request removal, contact us.',
    'about.contact': 'Contact',
    'about.contactNone': 'Contact details will be published here soon.',
    'about.disclaimerTitle': 'Medical disclaimer',
    'about.disclaimerBody':
      'Sehatalay is an information directory, not a medical service. It does not provide medical advice, diagnosis or treatment, and does not recommend or endorse any provider. In an emergency, call 108 or go to the nearest hospital.',
    'about.privacyTitle': 'Privacy',
    'about.privacyBody':
      'Visitors do not need an account to use Sehatalay, and we do not collect personal health information. Your language preference is stored only in your own browser.',

    'footer.disclaimer':
      'Sehatalay is an information directory and does not provide medical advice. In an emergency, call 108.',
    'footer.free': 'All provider listings are free.',
    'footer.rights': 'Sehatalay — Sehat Ka Ghar',
    'cta.list': 'Are you a doctor, lab or pharmacy in Dewas? Listing is free. Email us to register, correct or remove a listing:',

    'setup.title': 'Website setup is not complete',
    'setup.body':
      'The database connection has not been configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see README) and redeploy.',

    'notfound.title': 'Page not found',
    'notfound.body': 'The page you are looking for does not exist.',
    'notfound.home': 'Go to home page',

    'ad.label': 'Advertisement',
  },

  hi: {
    brand: 'सेहतालय',
    tagline: 'सेहत का घर',
    city: 'देवास, मध्य प्रदेश',
    na: 'उपलब्ध नहीं',

    'nav.home': 'होम',
    'nav.doctors': 'डॉक्टर',
    'nav.labs': 'लैब',
    'nav.pharmacies': 'मेडिकल स्टोर',
    'nav.about': 'हमारे बारे में',
    'nav.menu': 'मेनू',
    'lang.switch': 'English',
    'lang.switchLabel': 'भाषा अंग्रेज़ी में बदलें',
    'theme.dark': 'डार्क',
    'theme.light': 'लाइट',
    'theme.toDark': 'डार्क मोड चालू करें',
    'theme.toLight': 'लाइट मोड चालू करें',

    'home.title': 'देवास में डॉक्टर, लैब और मेडिकल स्टोर खोजें',
    'home.subtitle':
      'देवास के लिए एक निःशुल्क और निष्पक्ष स्वास्थ्य निर्देशिका। हर लिस्टिंग प्रकाशित होने से पहले हमारी टीम द्वारा जाँची जाती है।',
    'home.searchPlaceholder': 'डॉक्टर का नाम, क्षेत्र या विशेषज्ञता से खोजें',
    'home.search': 'खोजें',
    'home.browseOrgan': 'स्वास्थ्य समस्या के अनुसार डॉक्टर देखें',
    'home.categories': 'आप क्या खोज रहे हैं?',
    'home.doctorsDesc': 'विशेषज्ञता और क्षेत्र के अनुसार डॉक्टर एवं क्लिनिक',
    'home.labsDesc': 'डायग्नोस्टिक एवं पैथोलॉजी लैब',
    'home.pharmaciesDesc': 'मेडिकल स्टोर एवं फार्मेसी',
    'home.principles': 'सेहतालय कैसे काम करता है',
    'home.p1.title': 'प्रकाशन से पहले जाँच',
    'home.p1.body':
      'लिस्टिंग सार्वजनिक स्रोतों से जुटाई जाती हैं और स्वामी की स्वीकृति के बाद ही दिखाई जाती हैं। अपुष्ट जानकारी "उपलब्ध नहीं" के रूप में दिखाई जाती है।',
    'home.p2.title': 'निष्पक्ष क्रम',
    'home.p2.body':
      'कोई पेड रैंकिंग नहीं और कोई "टॉप डॉक्टर" सूची नहीं। लिस्टिंग वर्णानुक्रम में दिखाई जाती हैं और फ़िल्टर आप चुनते हैं।',
    'home.p3.title': 'कोई बनावटी रेटिंग नहीं',
    'home.p3.body':
      'हम मनगढ़ंत समीक्षाएँ या स्टार रेटिंग प्रकाशित नहीं करते। "सत्यापित" चिह्न पंजीकरण की जाँच के बाद ही दिखता है।',
    'home.p4.title': 'प्रदाताओं के लिए निःशुल्क',
    'home.p4.body': 'शुरुआत में सभी लिस्टिंग निःशुल्क हैं।',

    'dir.doctors.title': 'देवास के डॉक्टर',
    'dir.labs.title': 'देवास की डायग्नोस्टिक लैब',
    'dir.pharmacies.title': 'देवास के मेडिकल स्टोर एवं फार्मेसी',
    'dir.searchDoctors': 'नाम, क्षेत्र या विशेषज्ञता से खोजें',
    'dir.searchOther': 'नाम या क्षेत्र से खोजें',
    'dir.specialty': 'विशेषज्ञता',
    'dir.allSpecialties': 'सभी विशेषज्ञताएँ',
    'dir.organ': 'स्वास्थ्य समस्या',
    'dir.allOrgans': 'सभी स्वास्थ्य समस्याएँ',
    'dir.area': 'क्षेत्र',
    'dir.allAreas': 'सभी क्षेत्र',
    'dir.sort': 'क्रम',
    'dir.sort.nameAsc': 'नाम (A–Z)',
    'dir.sort.nameDesc': 'नाम (Z–A)',
    'dir.sort.area': 'क्षेत्र (A–Z)',
    'dir.clear': 'फ़िल्टर हटाएँ',
    'dir.results': '{count} लिस्टिंग',
    'dir.showing': '{count} में से {from}–{to} दिखाई जा रही हैं',
    'dir.empty.title': 'अभी कोई प्रकाशित लिस्टिंग नहीं है',
    'dir.empty.body':
      'लिस्टिंग जाँच और स्वीकृति के बाद ही यहाँ दिखाई जाती हैं। कृपया कुछ समय बाद फिर देखें।',
    'dir.emptyFiltered.title': 'आपकी खोज से कोई लिस्टिंग नहीं मिली',
    'dir.emptyFiltered.body': 'कोई दूसरा नाम, क्षेत्र या फ़िल्टर आज़माएँ।',
    'dir.neutral':
      'लिस्टिंग वर्णानुक्रम में दिखाई जाती हैं। सेहतालय प्रदाताओं की रैंकिंग नहीं करता और स्थान के लिए कोई भुगतान नहीं लेता।',
    'dir.error': 'लिस्टिंग लोड नहीं हो सकीं। कृपया पुनः प्रयास करें।',
    'dir.loading': 'लिस्टिंग लोड हो रही हैं…',

    'page.prev': 'पिछला',
    'page.next': 'अगला',
    'page.page': 'पृष्ठ {n}',
    'page.nav': 'पृष्ठ क्रमांक',

    'card.view': 'विवरण देखें',
    'card.verified': 'सत्यापित',
    'card.verifiedTitle': 'पंजीकरण विवरण सेहतालय द्वारा जाँचा गया',
    'card.experience': '{n} वर्ष का अनुभव',

    'field.specialty': 'विशेषज्ञता',
    'field.qualifications': 'योग्यता',
    'field.experience': 'अनुभव',
    'field.experienceYears': '{n} वर्ष',
    'field.registration': 'पंजीकरण संख्या',
    'field.council': 'पंजीकरण परिषद',
    'field.regVerified': 'पंजीकरण सत्यापित',
    'field.regNotVerified': 'अभी सत्यापित नहीं',
    'field.clinic': 'क्लिनिक / अस्पताल',
    'field.address': 'पता',
    'field.area': 'क्षेत्र',
    'field.timings': 'समय',
    'field.website': 'वेबसाइट',
    'field.verifiedPhone': 'सत्यापित संपर्क नंबर',
    'field.phoneUnverified': 'संपर्क नंबर (अभी सत्यापित नहीं)',
    'field.phoneNone': 'संपर्क नंबर: उपलब्ध नहीं',
    'field.phoneUnverifiedNote': 'यह नंबर सार्वजनिक स्रोतों से लिया गया है और सेहतालय द्वारा अभी पुष्टि नहीं की गई है।',
    'field.maps': 'Google Maps लिस्टिंग खोलें',
    'field.mapsSearch': 'यह पता Google Maps पर खोजें',
    'field.updated': 'लिस्टिंग अंतिम बार अपडेट हुई',

    'detail.back': 'सूची पर वापस जाएँ',
    'detail.notFound': 'यह लिस्टिंग उपलब्ध नहीं है।',
    'detail.contact': 'संपर्क',
    'detail.details': 'विवरण',
    'detail.location': 'स्थान',
    'detail.disclaimer':
      'जानकारी सार्वजनिक स्रोतों और प्रदाता की पुष्टि से संकलित है। कृपया समय और उपलब्धता की पुष्टि सीधे प्रदाता से करें। सेहतालय चिकित्सा सलाह नहीं देता।',
    'detail.report': 'कुछ गलत दिख रहा है? हमें बताएँ ताकि हम सुधार सकें।',

    'action.chat': 'चैट',
    'action.call': 'कॉल',
    'action.close': 'बंद करें',
    'modal.chat.title': 'चैट सुविधा — जल्द आ रही है',
    'modal.chat.alt': 'Messaging — Coming Soon',
    'modal.chat.body': 'प्रदाताओं के साथ इन-ऐप मैसेजिंग अभी उपलब्ध नहीं है। हम इस पर काम कर रहे हैं।',
    'modal.call.title': 'वॉइस कनेक्ट — विकास में है',
    'modal.call.alt': 'Voice Connect — In Development',
    'modal.call.body':
      'इन-ऐप कॉलिंग अभी उपलब्ध नहीं है। यदि इस प्रदाता का सत्यापित संपर्क नंबर उपलब्ध है, तो वह लिस्टिंग पर दिखाया गया है।',

    'about.title': 'सेहतालय के बारे में',
    'about.meaning': 'सेहतालय का अर्थ है "सेहत का घर"।',
    'about.body1':
      'सेहतालय एक निःशुल्क स्वास्थ्य निर्देशिका है, जिसकी शुरुआत देवास, मध्य प्रदेश से हो रही है। यह हिंदी और अंग्रेज़ी में लोगों को अपने आसपास के डॉक्टर, डायग्नोस्टिक लैब और मेडिकल स्टोर खोजने में मदद करती है।',
    'about.body2':
      'लिस्टिंग आधिकारिक वेबसाइटों और पंजीकरण निर्देशिकाओं जैसे सार्वजनिक, अनुमत स्रोतों तथा प्रदाता की सीधी पुष्टि से तैयार की जाती हैं। कुछ भी अपने-आप प्रकाशित नहीं होता: हर लिस्टिंग पहले स्वामी द्वारा जाँची और स्वीकृत की जाती है।',
    'about.body3':
      'जहाँ जानकारी की पुष्टि नहीं हो सकी, वहाँ हम अनुमान लगाने के बजाय "उपलब्ध नहीं" दिखाते हैं। हम कभी भी काल्पनिक डॉक्टर, व्यवसाय, रेटिंग या समीक्षाएँ प्रकाशित नहीं करते।',
    'about.providers': 'डॉक्टर, लैब और मेडिकल स्टोर के लिए',
    'about.providersBody':
      'शुरुआत में लिस्टिंग निःशुल्क हैं। अपनी लिस्टिंग जोड़ने, सुधारने या हटवाने के लिए हमसे संपर्क करें।',
    'about.contact': 'संपर्क',
    'about.contactNone': 'संपर्क विवरण शीघ्र ही यहाँ प्रकाशित किए जाएँगे।',
    'about.disclaimerTitle': 'चिकित्सा अस्वीकरण',
    'about.disclaimerBody':
      'सेहतालय एक सूचना निर्देशिका है, चिकित्सा सेवा नहीं। यह चिकित्सा सलाह, निदान या उपचार नहीं देता और किसी प्रदाता की सिफ़ारिश या समर्थन नहीं करता। आपात स्थिति में 108 पर कॉल करें या निकटतम अस्पताल जाएँ।',
    'about.privacyTitle': 'गोपनीयता',
    'about.privacyBody':
      'सेहतालय का उपयोग करने के लिए खाते की आवश्यकता नहीं है, और हम कोई व्यक्तिगत स्वास्थ्य जानकारी एकत्र नहीं करते। आपकी भाषा की पसंद केवल आपके अपने ब्राउज़र में संग्रहीत होती है।',

    'footer.disclaimer':
      'सेहतालय एक सूचना निर्देशिका है और चिकित्सा सलाह नहीं देता। आपात स्थिति में 108 पर कॉल करें।',
    'footer.free': 'सभी लिस्टिंग निःशुल्क हैं।',
    'footer.rights': 'सेहतालय — सेहत का घर',
    'cta.list': 'क्या आप देवास में डॉक्टर, लैब या मेडिकल स्टोर हैं? लिस्टिंग निःशुल्क है। अपनी लिस्टिंग जोड़ने, सुधारने या हटवाने के लिए हमें ईमेल करें:'

    'setup.title': 'वेबसाइट सेटअप पूरा नहीं हुआ है',
    'setup.body':
      'डेटाबेस कनेक्शन अभी कॉन्फ़िगर नहीं किया गया है। VITE_SUPABASE_URL और VITE_SUPABASE_ANON_KEY जोड़ें (README देखें) और पुनः डिप्लॉय करें।',

    'notfound.title': 'पृष्ठ नहीं मिला',
    'notfound.body': 'आप जो पृष्ठ खोज रहे हैं वह मौजूद नहीं है।',
    'notfound.home': 'होम पेज पर जाएँ',

    'ad.label': 'विज्ञापन',
  },
};

const LangContext = createContext(null);
const STORAGE_KEY = 'sehatalaya.lang';

function initialLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'hi' || saved === 'en') return saved;
  } catch {
    /* storage unavailable */
  }
  return 'hi';
}

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(initialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const t = useCallback(
    (key, vars) => {
      let text = STRINGS[lang][key] ?? STRINGS.en[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          text = text.replaceAll(`{${k}}`, String(v));
        }
      }
      return text;
    },
    [lang],
  );

  // Pick the Hindi or English value of a bilingual record field.
  const pick = useCallback(
    (en, hi) => (lang === 'hi' && hi ? hi : en) || hi || '',
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t, pick }), [lang, setLang, t, pick]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used inside LangProvider');
  return ctx;
}
