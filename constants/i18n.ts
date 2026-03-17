export type Locale = "ar" | "en";

export interface Translations {
  appTitle: string;
  tabs: { player: string; history: string; favorites: string };
  home: {
    subtitle: (n: number) => string;
    filters: { all: string; video: string; audio: string; image: string; docs: string };
    empty: { title: string; desc: string; btn: string };
    noItems: (f: string) => string;
  };
  history: {
    title: string;
    subtitle: (n: number) => string;
    clear: string;
    clearTitle: string;
    clearMsg: string;
    empty: { title: string; desc: string };
  };
  favorites: {
    title: string;
    subtitle: (n: number) => string;
    empty: { title: string; desc: string };
  };
  modal: {
    title: string;
    urlLabel: string;
    urlPlaceholder: string;
    titleLabel: string;
    titlePlaceholder: string;
    advanced: string;
    userAgentLabel: string;
    userAgentPlaceholder: string;
    userAgentHint: string;
    examples: string;
    play: string;
  };
  player: {
    subtitle: string;
    subtitleNone: string;
    subtitleUrl: string;
    subtitleUrlPlaceholder: string;
    subtitleFile: string;
    subtitleLoad: string;
    subtitleCancel: string;
    subtitleError: string;
    loading: { video: string; audio: string; image: string; content: string };
    error: { title: string; desc: string; retry: string };
    pdf: { title: string; desc: string; btn: string };
    unknown: { title: string; desc: string; btn: string };
    download: { success: string; successMsg: string; fail: string; failMsg: string; copied: string; copiedMsg: string };
    permNeeded: string;
    permMsg: string;
  };
  card: {
    justNow: string;
    minutesAgo: (m: number) => string;
    hoursAgo: (h: number) => string;
    daysAgo: (d: number) => string;
    remove: string;
    removeMsg: string;
    cancel: string;
  };
  cancel: string;
  clearAll: string;
}

const en: Translations = {
  appTitle: "URL Player+",
  tabs: { player: "Player", history: "History", favorites: "Favorites" },
  home: {
    subtitle: (n) => n > 0 ? `${n} item${n !== 1 ? "s" : ""} in history` : "Add your first media URL",
    filters: { all: "All", video: "Video", audio: "Audio", image: "Image", docs: "Docs" },
    empty: { title: "No Media Added", desc: "Add a URL to start playing videos, audio, images, PDFs, and more", btn: "Add Media URL" },
    noItems: (f) => `No ${f.toLowerCase()} items yet`,
  },
  history: {
    title: "History",
    subtitle: (n) => n > 0 ? `${n} played item${n !== 1 ? "s" : ""}` : "No history yet",
    clear: "Clear", clearTitle: "Clear History", clearMsg: "Remove all history items?",
    empty: { title: "No History", desc: "Your playback history will appear here" },
  },
  favorites: {
    title: "Favorites",
    subtitle: (n) => n > 0 ? `${n} saved item${n !== 1 ? "s" : ""}` : "Save your favorite media",
    empty: { title: "No Favorites", desc: "Tap the heart icon on any media item to save it here" },
  },
  modal: {
    title: "Add Media", urlLabel: "Media URL", urlPlaceholder: "https://example.com/video.mp4",
    titleLabel: "Title", titlePlaceholder: "Optional title", advanced: "Advanced",
    userAgentLabel: "User-Agent", userAgentPlaceholder: "Custom User-Agent",
    userAgentHint: "Override HTTP User-Agent for restricted streams", examples: "Quick Examples", play: "Play Now",
  },
  player: {
    subtitle: "Subtitles", subtitleNone: "None", subtitleUrl: "Subtitle URL",
    subtitleUrlPlaceholder: "https://example.com/subtitles.srt", subtitleFile: "Pick Local File",
    subtitleLoad: "Load", subtitleCancel: "Cancel", subtitleError: "Could not load subtitle file",
    loading: { video: "Loading video...", audio: "Loading audio...", image: "Loading image...", content: "Loading content..." },
    error: { title: "Could Not Load Media", desc: "The URL may be invalid or the media format is not supported.", retry: "Try Again" },
    pdf: { title: "PDF Document", desc: "Tap Download to save the PDF to your device and open it with a PDF viewer.", btn: "Download PDF" },
    unknown: { title: "Unknown Media Type", desc: "Download the file to your device to open it.", btn: "Download File" },
    download: { success: "Saved!", successMsg: "Media saved to your library.", fail: "Download Failed", failMsg: "Could not download the file. Please check the URL and try again.", copied: "Copied!", copiedMsg: "URL copied to clipboard." },
    permNeeded: "Permission Required", permMsg: "Please allow access to save media to your library.",
  },
  card: {
    justNow: "Just now", minutesAgo: (m) => `${m}m ago`, hoursAgo: (h) => `${h}h ago`, daysAgo: (d) => `${d}d ago`,
    remove: "Remove", removeMsg: "Remove this item from history?", cancel: "Cancel",
  },
  cancel: "Cancel", clearAll: "Clear All",
};

const ar: Translations = {
  appTitle: "URL Player+",
  tabs: { player: "المشغل", history: "السجل", favorites: "المفضلة" },
  home: {
    subtitle: (n) => n > 0 ? `${n} ${n === 1 ? "عنصر" : "عناصر"} في السجل` : "أضف أول رابط وسائط",
    filters: { all: "الكل", video: "فيديو", audio: "صوت", image: "صور", docs: "مستندات" },
    empty: { title: "لا توجد وسائط", desc: "أضف رابطاً لتشغيل الفيديو والصوت والصور وملفات PDF والمزيد", btn: "إضافة رابط وسائط" },
    noItems: (f) => `لا توجد ${f} بعد`,
  },
  history: {
    title: "السجل",
    subtitle: (n) => n > 0 ? `${n} ${n === 1 ? "عنصر" : "عناصر"} مُشغَّل` : "لا يوجد سجل",
    clear: "مسح", clearTitle: "مسح السجل", clearMsg: "هل تريد إزالة جميع عناصر السجل؟",
    empty: { title: "لا يوجد سجل", desc: "سيظهر سجل التشغيل هنا" },
  },
  favorites: {
    title: "المفضلة",
    subtitle: (n) => n > 0 ? `${n} ${n === 1 ? "عنصر" : "عناصر"} محفوظ` : "احفظ وسائطك المفضلة",
    empty: { title: "لا توجد مفضلة", desc: "اضغط على أيقونة القلب على أي عنصر لحفظه هنا" },
  },
  modal: {
    title: "إضافة وسائط", urlLabel: "رابط الوسائط", urlPlaceholder: "https://example.com/video.mp4",
    titleLabel: "العنوان", titlePlaceholder: "عنوان اختياري", advanced: "خيارات متقدمة",
    userAgentLabel: "User-Agent", userAgentPlaceholder: "User-Agent مخصص",
    userAgentHint: "تجاوز رأس HTTP User-Agent للبث المقيد", examples: "أمثلة سريعة", play: "تشغيل الآن",
  },
  player: {
    subtitle: "ترجمة", subtitleNone: "بدون", subtitleUrl: "رابط الترجمة",
    subtitleUrlPlaceholder: "https://example.com/subtitles.srt", subtitleFile: "اختر ملفاً محلياً",
    subtitleLoad: "تحميل", subtitleCancel: "إلغاء", subtitleError: "تعذر تحميل ملف الترجمة",
    loading: { video: "جارٍ تحميل الفيديو...", audio: "جارٍ تحميل الصوت...", image: "جارٍ تحميل الصورة...", content: "جارٍ تحميل المحتوى..." },
    error: { title: "تعذر تحميل الوسائط", desc: "قد يكون الرابط غير صالح أو تنسيق الوسائط غير مدعوم.", retry: "حاول مجدداً" },
    pdf: { title: "مستند PDF", desc: "اضغط تنزيل لحفظ الـ PDF على جهازك وفتحه ببرنامج مناسب.", btn: "تنزيل PDF" },
    unknown: { title: "نوع وسائط غير معروف", desc: "نزّل الملف على جهازك لفتحه.", btn: "تنزيل الملف" },
    download: { success: "تم الحفظ!", successMsg: "تم حفظ الوسائط في مكتبتك.", fail: "فشل التنزيل", failMsg: "تعذر تنزيل الملف. يرجى التحقق من الرابط والمحاولة مجدداً.", copied: "تم النسخ!", copiedMsg: "تم نسخ الرابط إلى الحافظة." },
    permNeeded: "إذن مطلوب", permMsg: "يرجى السماح بالوصول لحفظ الوسائط في مكتبتك.",
  },
  card: {
    justNow: "الآن", minutesAgo: (m) => `منذ ${m} دقيقة`, hoursAgo: (h) => `منذ ${h} ساعة`, daysAgo: (d) => `منذ ${d} يوم`,
    remove: "إزالة", removeMsg: "هل تريد إزالة هذا العنصر من السجل؟", cancel: "إلغاء",
  },
  cancel: "إلغاء", clearAll: "مسح الكل",
};

export const translations: Record<Locale, Translations> = { en, ar };
