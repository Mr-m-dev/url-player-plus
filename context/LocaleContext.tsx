import * as Localization from "expo-localization";
import React, { createContext, useContext, useEffect, useState } from "react";
import { I18nManager } from "react-native";

import { Locale, Translations, translations } from "@/constants/i18n";

interface LocaleContextType {
  locale: Locale;
  t: Translations;
  isRTL: boolean;
}

const LocaleContext = createContext<LocaleContextType>({
  locale: "en",
  t: translations.en,
  isRTL: false,
});

function detectLocale(): Locale {
  try {
    const locales = Localization.getLocales();
    const lang = locales[0]?.languageCode ?? "en";
    return lang === "ar" ? "ar" : "en";
  } catch {
    return "en";
  }
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>(detectLocale);

  const isRTL = locale === "ar";

  useEffect(() => {
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.allowRTL(isRTL);
      I18nManager.forceRTL(isRTL);
    }
  }, [isRTL]);

  return (
    <LocaleContext.Provider value={{ locale, t: translations[locale], isRTL }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
