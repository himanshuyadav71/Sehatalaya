import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase.js';

export const DEFAULT_SETTINGS = {
  announcement_en: '',
  announcement_hi: '',
  contact_email: '',
  adsense_enabled: false,
  adsense_client: '',
};

const SettingsContext = createContext({ settings: DEFAULT_SETTINGS, reload: () => {} });

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const reload = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from('site_settings').select('key, value');
    if (error || !data) return;
    const next = { ...DEFAULT_SETTINGS };
    for (const row of data) next[row.key] = row.value;
    setSettings(next);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const value = useMemo(() => ({ settings, reload }), [settings, reload]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}
