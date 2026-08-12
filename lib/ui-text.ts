"use client"

import { useMemo } from "react"
import { useSettings, type LanguageCode } from "@/lib/settings-context"
import { useCallback, useEffect, useRef, useState } from "react"

type UiLocale = "en" | "es" | "fr" | "ru" | "zh" | "ja" | "vi" | "hi" | "ar" | "pt" | "de" | "ko" | "id" | "tr" | "it"

const AUTO_TRANSLATE_CACHE_PREFIX = "1key-ui-i18n"

const EN = {
  "nav.home": "Home",
  "nav.games": "Games",
  "nav.music": "Apps",
  "nav.links": "Links",
  "nav.proxy": "Proxy",
  "nav.data": "Data",
  "nav.settings": "Settings",
  "nav.version": "Version",
  "nav.build": "Build",
  "nav.updated": "Updated",

  "hero.browseGames": "Browse Games",
  "hero.exploreLinks": "Explore Links",
  "hero.projectUpdates": "Project Updates",
  "hero.changelog": "Changelog",

  "announcement.title": "Website v3.2",
  "announcement.subtitle": "Version 3.2 Update • Updated Feb 24, 2026",
  "announcement.closeAria": "Close announcement",
  "announcement.highlights": "v3.2 highlights:",
  "announcement.line1": "Shipped an entire UI overhaul.",
  "announcement.line2": "Added new 1Key mirror links with launch + copy actions.",
  "announcement.line3": "Updated intro visuals and added new games.",
  "announcement.line4": "Fixed major layout and interaction bugs across pages.",
  "announcement.thanks": "Thanks for playing.",
  "announcement.gotIt": "Got it",

  "settings.title": "Settings",
  "settings.subtitle": "Everything saves automatically.",
  "settings.sectionLabel": "Section",
  "common.dismiss": "Dismiss",
  "settings.section.info": "Info",
  "settings.section.site": "Site",
  "settings.section.language": "Language",
  "settings.section.background": "Background",
  "settings.section.mouse": "Mouse",
  "settings.section.sound": "Sound",
  "settings.section.disguise": "Disguise",
  "settings.section.font": "Font",
  "settings.section.theme": "Theme",
  "settings.switchSections": "Use the left sidebar to switch sections. Changes apply instantly.",

  "settings.info.welcome": "Welcome to Settings — this is where you customize everything about your 1key experience.",
  "settings.info.sidebar":
    "The left sidebar works like docs: click a section to jump straight to what you want (Background, Mouse, Sound, Disguise, Font, and Theme).",
  "settings.info.autosave":
    "Everything saves automatically to your browser (no accounts, no sign-in). If something looks wrong, a hard refresh usually fixes stale cache.",
  "settings.info.protipTitle": "Pro tip",
  "settings.info.protipBody":
    "If you want smoother animations on slower devices, turn on Performance Mode in the Background section.",

  "settings.site.header": "Controls what shows in your top bar. These only affect your device.",
  "settings.site.showTime.title": "Show Time",
  "settings.site.showTime.desc": "Displays the current time in the top bar.",
  "settings.site.military.title": "Military Time",
  "settings.site.military.desc": "Uses 24-hour clock format (only affects the top-right time).",
  "settings.site.showBattery.title": "Show Battery",
  "settings.site.showBattery.desc": "Shows your device battery level (if supported).",
  "settings.site.guiScale.title": "GUI Scale",
  "settings.site.guiScale.desc": "Resizes the whole site UI on your device.",
  "settings.site.launchMode.title": "Launch Mode",
  "settings.site.launchMode.desc": "Controls how links open. Keep about:blank for best compatibility.",
  "settings.site.showOnline.title": "Show Online Count",
  "settings.site.showOnline.desc":
    "Displays “Online: N” in the top bar. Turning this off hides the number (you still count as online).",
  "settings.site.reload.title": "Reload Protection",
  "settings.site.reload.desc": "Warn before reloading or closing the tab.",

  "settings.language.header": "Pick your preferred locale for time formatting and future language support.",
  "settings.language.title": "Language",
  "settings.language.desc": "English is the default. Other options adjust locale formatting.",
} as const

type UiKey = keyof typeof EN

const TRANSLATIONS: Record<UiLocale, Partial<Record<UiKey, string>>> = {
  en: {},
  es: {
    "nav.home": "Inicio",
    "nav.games": "Juegos",
    "nav.proxy": "Proxy",
    "nav.links": "Enlaces",
    "nav.data": "Datos",
    "nav.settings": "Ajustes",
    "hero.browseGames": "Explorar juegos",
    "hero.exploreLinks": "Explorar enlaces",
    "hero.projectUpdates": "Actualizaciones del proyecto",
    "hero.changelog": "Registro de cambios",
    "announcement.title": "Sitio web v3.2",
    "announcement.subtitle": "Actualización de la versión 3.2 • Actualizado el 24 feb 2026",
    "announcement.closeAria": "Cerrar anuncio",
    "announcement.highlights": "Novedades de v3.2:",
    "announcement.line1": "Se lanzó una renovación completa de la interfaz.",
    "announcement.line2": "Se agregaron nuevos enlaces espejo de 1Key con acciones de abrir y copiar.",
    "announcement.line3": "Se actualizaron los visuales de la introducción y se agregaron nuevos juegos.",
    "announcement.line4": "Se corrigieron errores importantes de diseño e interacción en todas las páginas.",
    "announcement.thanks": "Gracias por jugar.",
    "announcement.gotIt": "Entendido",
    "settings.title": "Ajustes",
    "settings.subtitle": "Todo se guarda automáticamente.",
    "settings.section.info": "Info",
    "settings.section.site": "Sitio",
    "settings.section.language": "Idioma",
    "settings.section.background": "Fondo",
    "settings.section.mouse": "Mouse",
    "settings.section.sound": "Sonido",
    "settings.section.disguise": "Disfraz",
    "settings.section.font": "Fuente",
    "settings.section.theme": "Tema",
    "settings.switchSections": "Usa la barra lateral izquierda para cambiar de sección. Los cambios se aplican al instante.",
  },
  fr: {
    "nav.home": "Accueil",
    "nav.games": "Jeux",
    "nav.proxy": "Proxy",
    "nav.links": "Liens",
    "nav.data": "Données",
    "nav.settings": "Paramètres",
    "hero.browseGames": "Parcourir les jeux",
    "hero.exploreLinks": "Explorer les liens",
    "hero.projectUpdates": "Mises à jour du projet",
    "hero.changelog": "Journal des changements",
    "announcement.title": "Site web v3.2",
    "announcement.subtitle": "Mise à jour version 3.2 • Mis à jour le 24 fév. 2026",
    "announcement.closeAria": "Fermer l’annonce",
    "announcement.highlights": "Points forts v3.2 :",
    "announcement.gotIt": "Compris",
    "settings.title": "Paramètres",
    "settings.subtitle": "Tout est enregistré automatiquement.",
    "settings.section.site": "Site",
    "settings.section.language": "Langue",
    "settings.section.background": "Arrière-plan",
    "settings.section.sound": "Son",
  },
  ru: {
    "nav.home": "Главная",
    "nav.games": "Игры",
    "nav.proxy": "Прокси",
    "nav.links": "Ссылки",
    "nav.data": "Данные",
    "nav.settings": "Настройки",
    "hero.browseGames": "Игры",
    "hero.exploreLinks": "Ссылки",
    "hero.projectUpdates": "Обновления проекта",
    "hero.changelog": "Список изменений",
    "announcement.title": "Сайт v3.2",
    "announcement.subtitle": "Обновление версии 3.2 • Обновлено 24 фев 2026",
    "announcement.closeAria": "Закрыть объявление",
    "announcement.highlights": "Основное в v3.2:",
    "announcement.gotIt": "Понятно",
    "settings.title": "Настройки",
    "settings.subtitle": "Все сохраняется автоматически.",
    "settings.section.site": "Сайт",
    "settings.section.language": "Язык",
    "settings.section.background": "Фон",
    "settings.section.sound": "Звук",
  },
  zh: {
    "nav.home": "主页",
    "nav.games": "游戏",
    "nav.proxy": "代理",
    "nav.links": "链接",
    "nav.data": "数据",
    "nav.settings": "设置",
    "hero.browseGames": "浏览游戏",
    "hero.exploreLinks": "查看链接",
    "hero.projectUpdates": "项目更新",
    "hero.changelog": "更新日志",
    "announcement.title": "网站 v3.2",
    "announcement.subtitle": "3.2 版本更新 • 2026年2月24日更新",
    "announcement.closeAria": "关闭公告",
    "announcement.highlights": "v3.2 亮点：",
    "announcement.gotIt": "知道了",
    "settings.title": "设置",
    "settings.subtitle": "所有更改会自动保存。",
    "settings.section.site": "站点",
    "settings.section.language": "语言",
    "settings.section.background": "背景",
    "settings.section.sound": "声音",
  },
  ja: {
    "nav.home": "ホーム",
    "nav.games": "ゲーム",
    "nav.proxy": "プロキシ",
    "nav.links": "リンク",
    "nav.data": "データ",
    "nav.settings": "設定",
    "hero.browseGames": "ゲームを見る",
    "hero.exploreLinks": "リンクを見る",
    "hero.projectUpdates": "プロジェクト更新",
    "hero.changelog": "変更履歴",
    "announcement.title": "ウェブサイト v3.2",
    "announcement.subtitle": "バージョン 3.2 更新 • 2026/02/24 更新",
    "announcement.closeAria": "お知らせを閉じる",
    "announcement.highlights": "v3.2 のハイライト:",
    "announcement.gotIt": "了解",
    "settings.title": "設定",
    "settings.subtitle": "すべて自動保存されます。",
    "settings.section.site": "サイト",
    "settings.section.language": "言語",
    "settings.section.background": "背景",
    "settings.section.sound": "サウンド",
  },
  vi: {
    "nav.home": "Trang chủ",
    "nav.games": "Trò chơi",
    "nav.proxy": "Proxy",
    "nav.links": "Liên kết",
    "nav.data": "Dữ liệu",
    "nav.settings": "Cài đặt",
    "hero.browseGames": "Xem trò chơi",
    "hero.exploreLinks": "Xem liên kết",
    "hero.projectUpdates": "Cập nhật dự án",
    "hero.changelog": "Nhật ký thay đổi",
    "announcement.title": "Trang web v3.2",
    "announcement.subtitle": "Cập nhật phiên bản 3.2 • Cập nhật ngày 24/02/2026",
    "announcement.closeAria": "Đóng thông báo",
    "announcement.highlights": "Điểm nổi bật v3.2:",
    "announcement.gotIt": "Đã hiểu",
    "settings.title": "Cài đặt",
    "settings.subtitle": "Mọi thứ được lưu tự động.",
    "settings.section.site": "Trang",
    "settings.section.language": "Ngôn ngữ",
    "settings.section.background": "Nền",
    "settings.section.sound": "Âm thanh",
  },
  hi: {
    "nav.home": "होम",
    "nav.games": "गेम्स",
    "nav.proxy": "प्रॉक्सी",
    "nav.links": "लिंक",
    "nav.data": "डेटा",
    "nav.settings": "सेटिंग्स",
    "hero.browseGames": "गेम देखें",
    "hero.exploreLinks": "लिंक देखें",
    "hero.projectUpdates": "प्रोजेक्ट अपडेट",
    "hero.changelog": "चेंजलॉग",
    "announcement.title": "वेबसाइट v3.2",
    "announcement.subtitle": "संस्करण 3.2 अपडेट • 24 फ़रवरी 2026 को अपडेट",
    "announcement.closeAria": "घोषणा बंद करें",
    "announcement.highlights": "v3.2 मुख्य बिंदु:",
    "announcement.gotIt": "ठीक है",
    "settings.title": "सेटिंग्स",
    "settings.subtitle": "सब कुछ अपने आप सेव होता है।",
    "settings.section.site": "साइट",
    "settings.section.language": "भाषा",
    "settings.section.background": "बैकग्राउंड",
    "settings.section.sound": "ध्वनि",
  },
  ar: {
    "nav.home": "الرئيسية",
    "nav.games": "الألعاب",
    "nav.proxy": "بروكسي",
    "nav.links": "الروابط",
    "nav.data": "البيانات",
    "nav.settings": "الإعدادات",
    "hero.browseGames": "تصفح الألعاب",
    "hero.exploreLinks": "استكشاف الروابط",
    "hero.projectUpdates": "تحديثات المشروع",
    "hero.changelog": "سجل التغييرات",
    "announcement.title": "الموقع v3.2",
    "announcement.subtitle": "تحديث الإصدار 3.2 • تم التحديث في 24 فبراير 2026",
    "announcement.closeAria": "إغلاق الإعلان",
    "announcement.highlights": "أبرز ما في v3.2:",
    "announcement.gotIt": "تم",
    "settings.title": "الإعدادات",
    "settings.subtitle": "يتم حفظ كل شيء تلقائيًا.",
    "settings.section.site": "الموقع",
    "settings.section.language": "اللغة",
    "settings.section.background": "الخلفية",
    "settings.section.sound": "الصوت",
  },
  pt: {
    "nav.home": "Início",
    "nav.games": "Jogos",
    "nav.proxy": "Proxy",
    "nav.links": "Links",
    "nav.data": "Dados",
    "nav.settings": "Configurações",
    "hero.browseGames": "Ver jogos",
    "hero.exploreLinks": "Explorar links",
    "hero.projectUpdates": "Atualizações do projeto",
    "hero.changelog": "Registro de alterações",
    "announcement.title": "Site v3.2",
    "announcement.subtitle": "Atualização da versão 3.2 • Atualizado em 24 fev 2026",
    "announcement.closeAria": "Fechar aviso",
    "announcement.highlights": "Destaques do v3.2:",
    "announcement.gotIt": "Entendi",
    "settings.title": "Configurações",
    "settings.subtitle": "Tudo é salvo automaticamente.",
    "settings.section.site": "Site",
    "settings.section.language": "Idioma",
    "settings.section.background": "Fundo",
    "settings.section.sound": "Som",
  },
  de: {
    "nav.home": "Start",
    "nav.games": "Spiele",
    "nav.proxy": "Proxy",
    "nav.links": "Links",
    "nav.data": "Daten",
    "nav.settings": "Einstellungen",
    "hero.browseGames": "Spiele ansehen",
    "hero.exploreLinks": "Links ansehen",
    "hero.projectUpdates": "Projekt-Updates",
    "hero.changelog": "Änderungsprotokoll",
    "announcement.title": "Website v3.2",
    "announcement.subtitle": "Version 3.2 Update • Aktualisiert am 24. Feb. 2026",
    "announcement.closeAria": "Hinweis schließen",
    "announcement.highlights": "v3.2 Highlights:",
    "announcement.gotIt": "Verstanden",
    "settings.title": "Einstellungen",
    "settings.subtitle": "Alles wird automatisch gespeichert.",
    "settings.section.site": "Seite",
    "settings.section.language": "Sprache",
    "settings.section.background": "Hintergrund",
    "settings.section.sound": "Sound",
  },
  ko: {
    "nav.home": "홈",
    "nav.games": "게임",
    "nav.proxy": "프록시",
    "nav.links": "링크",
    "nav.data": "데이터",
    "nav.settings": "설정",
    "hero.browseGames": "게임 보기",
    "hero.exploreLinks": "링크 보기",
    "hero.projectUpdates": "프로젝트 업데이트",
    "hero.changelog": "변경 로그",
    "announcement.title": "웹사이트 v3.2",
    "announcement.subtitle": "버전 3.2 업데이트 • 2026년 2월 24일 업데이트",
    "announcement.closeAria": "공지 닫기",
    "announcement.highlights": "v3.2 하이라이트:",
    "announcement.gotIt": "확인",
    "settings.title": "설정",
    "settings.subtitle": "모든 항목이 자동 저장됩니다.",
    "settings.section.site": "사이트",
    "settings.section.language": "언어",
    "settings.section.background": "배경",
    "settings.section.sound": "사운드",
  },
  id: {
    "nav.home": "Beranda",
    "nav.games": "Game",
    "nav.proxy": "Proksi",
    "nav.links": "Tautan",
    "nav.data": "Data",
    "nav.settings": "Pengaturan",
    "hero.browseGames": "Lihat game",
    "hero.exploreLinks": "Jelajahi tautan",
    "hero.projectUpdates": "Pembaruan proyek",
    "hero.changelog": "Catatan perubahan",
    "announcement.title": "Situs v3.2",
    "announcement.subtitle": "Pembaruan versi 3.2 • Diperbarui 24 Feb 2026",
    "announcement.closeAria": "Tutup pengumuman",
    "announcement.highlights": "Sorotan v3.2:",
    "announcement.gotIt": "Mengerti",
    "settings.title": "Pengaturan",
    "settings.subtitle": "Semua tersimpan otomatis.",
    "settings.section.site": "Situs",
    "settings.section.language": "Bahasa",
    "settings.section.background": "Latar",
    "settings.section.sound": "Suara",
  },
  tr: {
    "nav.home": "Ana Sayfa",
    "nav.games": "Oyunlar",
    "nav.proxy": "Proxy",
    "nav.links": "Bağlantılar",
    "nav.data": "Veri",
    "nav.settings": "Ayarlar",
    "hero.browseGames": "Oyunları Gör",
    "hero.exploreLinks": "Bağlantıları Keşfet",
    "hero.projectUpdates": "Proje güncellemeleri",
    "hero.changelog": "Değişiklik günlüğü",
    "announcement.title": "Web sitesi v3.2",
    "announcement.subtitle": "Sürüm 3.2 güncellemesi • 24 Şub 2026 güncellendi",
    "announcement.closeAria": "Duyuruyu kapat",
    "announcement.highlights": "v3.2 öne çıkanlar:",
    "announcement.gotIt": "Tamam",
    "settings.title": "Ayarlar",
    "settings.subtitle": "Her şey otomatik kaydedilir.",
    "settings.section.site": "Site",
    "settings.section.language": "Dil",
    "settings.section.background": "Arka plan",
    "settings.section.sound": "Ses",
  },
  it: {
    "nav.home": "Home",
    "nav.games": "Giochi",
    "nav.proxy": "Proxy",
    "nav.links": "Link",
    "nav.data": "Dati",
    "nav.settings": "Impostazioni",
    "hero.browseGames": "Sfoglia giochi",
    "hero.exploreLinks": "Esplora link",
    "hero.projectUpdates": "Aggiornamenti progetto",
    "hero.changelog": "Registro modifiche",
    "announcement.title": "Sito v3.2",
    "announcement.subtitle": "Aggiornamento versione 3.2 • Aggiornato il 24 feb 2026",
    "announcement.closeAria": "Chiudi annuncio",
    "announcement.highlights": "Punti salienti v3.2:",
    "announcement.gotIt": "Capito",
    "settings.title": "Impostazioni",
    "settings.subtitle": "Tutto viene salvato automaticamente.",
    "settings.section.site": "Sito",
    "settings.section.language": "Lingua",
    "settings.section.background": "Sfondo",
    "settings.section.sound": "Audio",
  },
}

const LOCALE_TO_TRANSLATE_CODE: Record<UiLocale, string> = {
  en: "en",
  es: "es",
  fr: "fr",
  ru: "ru",
  zh: "zh-CN",
  ja: "ja",
  vi: "vi",
  hi: "hi",
  ar: "ar",
  pt: "pt",
  de: "de",
  ko: "ko",
  id: "id",
  tr: "tr",
  it: "it",
}

const fetchAutoTranslation = async (text: string, locale: UiLocale) => {
  if (locale === "en") return text
  const target = LOCALE_TO_TRANSLATE_CODE[locale]
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${encodeURIComponent(
    target
  )}&dt=t&q=${encodeURIComponent(text)}`
  const response = await fetch(url)
  if (!response.ok) throw new Error("translate_request_failed")
  const payload = (await response.json()) as unknown
  if (!Array.isArray(payload) || !Array.isArray(payload[0])) return text
  const translated = (payload[0] as unknown[])
    .map((part) => (Array.isArray(part) && typeof part[0] === "string" ? part[0] : ""))
    .join("")
    .trim()
  return translated || text
}

const toLocale = (language: LanguageCode): UiLocale => {
  const base = language.toLowerCase().split("-")[0]
  switch (base) {
    case "es":
      return "es"
    case "fr":
      return "fr"
    case "ru":
      return "ru"
    case "zh":
      return "zh"
    case "ja":
      return "ja"
    case "vi":
      return "vi"
    case "hi":
      return "hi"
    case "ar":
      return "ar"
    case "pt":
      return "pt"
    case "de":
      return "de"
    case "ko":
      return "ko"
    case "id":
      return "id"
    case "tr":
      return "tr"
    case "it":
      return "it"
    default:
      return "en"
  }
}

type CachedTranslation = { source: string; value: string }
type CachedTranslations = Partial<Record<UiKey, CachedTranslation>>

const AUTO_TRANSLATE_CACHE_VERSION = "v2"
const TRANSLATION_BATCH_SIZE = 6
const FREE_TEXT_RETRY_DELAY_MS = 5 * 60_000

const localeCacheKey = (locale: UiLocale) =>
  `${AUTO_TRANSLATE_CACHE_PREFIX}:${AUTO_TRANSLATE_CACHE_VERSION}:${locale}`

const flattenTranslations = (entries: CachedTranslations) => {
  const flat: Partial<Record<UiKey, string>> = {}
  for (const key of Object.keys(entries) as UiKey[]) {
    const entry = entries[key]
    if (entry) flat[key] = entry.value
  }
  return flat
}

const readCachedTranslations = (locale: UiLocale) => {
  const entries: CachedTranslations = {}
  const staticDictionary = TRANSLATIONS[locale]
  try {
    localStorage.removeItem(`${AUTO_TRANSLATE_CACHE_PREFIX}:${locale}`)
    const raw = localStorage.getItem(localeCacheKey(locale))
    if (!raw) return entries
    const parsed = JSON.parse(raw) as Record<string, unknown>
    for (const [key, value] of Object.entries(parsed)) {
      if (!(key in EN)) continue
      const uiKey = key as UiKey
      if (staticDictionary[uiKey]) continue
      if (!value || typeof value !== "object") continue
      const entry = value as Partial<CachedTranslation>
      if (typeof entry.source !== "string" || typeof entry.value !== "string") continue
      if (entry.source !== EN[uiKey]) continue
      entries[uiKey] = { source: entry.source, value: entry.value }
    }
  } catch {
  }
  return entries
}

const persistCachedTranslations = (locale: UiLocale, entries: CachedTranslations) => {
  try {
    localStorage.setItem(localeCacheKey(locale), JSON.stringify(entries))
  } catch {
  }
}

const localeTranslations = new Map<UiLocale, CachedTranslations>()
const localeLoaders = new Map<UiLocale, Promise<void>>()
const localeListeners = new Map<UiLocale, Set<() => void>>()

const getLocaleTranslations = (locale: UiLocale) => {
  const existing = localeTranslations.get(locale)
  if (existing) return existing
  const entries = readCachedTranslations(locale)
  localeTranslations.set(locale, entries)
  return entries
}

const notifyLocaleListeners = (locale: UiLocale) => {
  const listeners = localeListeners.get(locale)
  if (!listeners) return
  for (const listener of Array.from(listeners)) listener()
}

const loadLocaleTranslations = async (locale: UiLocale) => {
  const entries = getLocaleTranslations(locale)
  const staticDictionary = TRANSLATIONS[locale]
  const missing = (Object.keys(EN) as UiKey[]).filter((key) => !staticDictionary[key] && !entries[key])
  if (!missing.length) {
    persistCachedTranslations(locale, entries)
    return
  }

  try {
    for (let index = 0; index < missing.length; index += TRANSLATION_BATCH_SIZE) {
      const batch = missing.slice(index, index + TRANSLATION_BATCH_SIZE)
      const results = await Promise.all(
        batch.map(async (key) => {
          try {
            return { key, value: await fetchAutoTranslation(EN[key], locale) }
          } catch {
            return null
          }
        })
      )
      let changed = false
      for (const result of results) {
        if (!result) continue
        entries[result.key] = { source: EN[result.key], value: result.value }
        changed = true
      }
      if (changed) notifyLocaleListeners(locale)
    }
  } finally {
    persistCachedTranslations(locale, entries)
  }
}

const ensureLocaleTranslations = (locale: UiLocale) => {
  const existing = localeLoaders.get(locale)
  if (existing) return existing
  const loader = loadLocaleTranslations(locale).finally(() => {
    localeLoaders.delete(locale)
  })
  localeLoaders.set(locale, loader)
  return loader
}

export function useUiText() {
  const { settings } = useSettings()
  const [autoTranslations, setAutoTranslations] = useState<Partial<Record<UiKey, string>>>({})
  const [autoFreeText, setAutoFreeText] = useState<Record<string, string>>({})
  const pendingFreeTextRef = useRef<Set<string>>(new Set())
  const failedFreeTextRef = useRef<Map<string, number>>(new Map())

  const locale = useMemo(() => toLocale(settings.language), [settings.language])
  const freeTextLocaleRef = useRef<UiLocale>(locale)

  useEffect(() => {
    if (locale === "en") {
      setAutoTranslations({})
      return
    }

    let cancelled = false
    const syncFromStore = () => {
      if (cancelled) return
      setAutoTranslations(flattenTranslations(getLocaleTranslations(locale)))
    }

    const existingListeners = localeListeners.get(locale)
    const listeners = existingListeners ?? new Set<() => void>()
    if (!existingListeners) localeListeners.set(locale, listeners)
    listeners.add(syncFromStore)

    syncFromStore()
    void ensureLocaleTranslations(locale)

    return () => {
      cancelled = true
      listeners.delete(syncFromStore)
    }
  }, [locale])

  useEffect(() => {
    freeTextLocaleRef.current = locale
    failedFreeTextRef.current.clear()
    if (locale === "en") {
      setAutoFreeText({})
      pendingFreeTextRef.current.clear()
      return
    }
    const cacheKey = `${AUTO_TRANSLATE_CACHE_PREFIX}:free:${locale}`
    try {
      const raw = localStorage.getItem(cacheKey)
      if (raw) {
        setAutoFreeText(JSON.parse(raw) as Record<string, string>)
      } else {
        setAutoFreeText({})
      }
    } catch {
      setAutoFreeText({})
    }
    pendingFreeTextRef.current.clear()
  }, [locale])

  const t = useCallback(
    (key: UiKey) => {
      const staticDictionary = TRANSLATIONS[locale]
      return staticDictionary[key] ?? autoTranslations[key] ?? EN[key]
    },
    [autoTranslations, locale]
  )

  const tx = useCallback(
    (text: string) => {
      if (locale === "en" || !text) return text
      if (autoFreeText[text]) return autoFreeText[text]
      if (pendingFreeTextRef.current.has(text)) return text
      const failedAt = failedFreeTextRef.current.get(text)
      if (failedAt !== undefined && Date.now() - failedAt < FREE_TEXT_RETRY_DELAY_MS) return text

      const requestLocale = locale
      pendingFreeTextRef.current.add(text)
      void fetchAutoTranslation(text, requestLocale)
        .then((translated) => {
          if (freeTextLocaleRef.current !== requestLocale) return
          failedFreeTextRef.current.delete(text)
          setAutoFreeText((prev) => {
            if (prev[text] === translated) return prev
            const next = { ...prev, [text]: translated }
            try {
              localStorage.setItem(`${AUTO_TRANSLATE_CACHE_PREFIX}:free:${requestLocale}`, JSON.stringify(next))
            } catch {
            }
            return next
          })
        })
        .catch(() => {
          if (freeTextLocaleRef.current !== requestLocale) return
          failedFreeTextRef.current.set(text, Date.now())
        })
        .finally(() => {
          if (freeTextLocaleRef.current !== requestLocale) return
          pendingFreeTextRef.current.delete(text)
        })

      return text
    },
    [autoFreeText, locale]
  )

  return useMemo(() => ({ t, tx, locale }), [t, tx, locale])
}
