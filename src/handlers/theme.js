import {
  THEME_STORE_CACHE_TTL_SECONDS,
  THEME_STORE_URL
} from '../utils/config.js'

// Site-local shortcuts only. The public CFSM-Theme-Store index is not modified.
const SELF_USE_THEMES = [
  {
    id: 'self-use-emerald',
    title: 'Emerald · 自用三网版',
    cover: 'https://raw.githubusercontent.com/lll33lll/cf-server-monitor-theme-emerald/7baeef7e89d8961418df18590b7ef616b465d4fb/docs/preview.png',
    tags: ['内置', '自用'],
    description: {
      'zh-CN': '基于 Tokinx Emerald 的自用改版。电信、联通、移动分别显示延迟和丢包；点柱子显示时间范围与数值，支持横向滑动查看。',
      en: 'Personal Emerald fork with separate CT/CU/CM latency and packet loss, plus inline history-bar inspection.'
    },
    url: 'https://github.com/lll33lll/cf-server-monitor-theme-emerald',
    branch: 'build',
    author: 'lll33lll'
  },
  {
    id: 'self-use-glassmorphism',
    title: 'Glassmorphism · 自用三网版',
    cover: 'https://raw.githubusercontent.com/lll33lll/CFSM-Glassmorphism/1d9824b1b7898c65a730d3139d258f34a1ed31f2/docs/screenshots/home-dark.webp',
    tags: ['内置', '自用'],
    description: {
      'zh-CN': '基于 CFSM-Glassmorphism 的自用毛玻璃改版。三网延迟与丢包分行显示，点柱子就地查看；保留地球、卡片列表及节点详情图表。',
      en: 'Personal Glassmorphism fork with separate three-network metrics, inline bar inspection, globe and node-detail charts.'
    },
    url: 'https://github.com/lll33lll/CFSM-Glassmorphism',
    branch: 'theme-custom',
    author: 'lll33lll'
  }
]

let cachedThemeStore = null
let cacheTime = 0

const createEmptyThemeStore = () => ({ schema: 1, themes: SELF_USE_THEMES })

const normalizeThemeStore = (data) => {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const selfIds = new Set(SELF_USE_THEMES.map(theme => theme.id))
    const selfUrls = new Set(SELF_USE_THEMES.map(theme => theme.url))
    const remoteThemes = Array.isArray(data.themes) ? data.themes : []
    return {
      ...data,
      schema: data.schema || 1,
      themes: [
        ...SELF_USE_THEMES,
        ...remoteThemes.filter(theme => theme && !selfIds.has(theme.id) && !selfUrls.has(theme.url))
      ]
    }
  }

  return createEmptyThemeStore()
}

export async function handleTheme() {
  const now = Math.floor(Date.now() / 1000)
  if (cachedThemeStore && (now - cacheTime) < THEME_STORE_CACHE_TTL_SECONDS) {
    return { ok: true, themeStore: cachedThemeStore, cached: true }
  }

  try {
    const res = await fetch(THEME_STORE_URL, {
      headers: { 'User-Agent': 'CFSM-Theme-Store' }
    })

    if (!res.ok) {
      return {
        ok: true,
        themeStore: cachedThemeStore || createEmptyThemeStore(),
        cached: Boolean(cachedThemeStore)
      }
    }

    const data = await res.json()
    const themeStore = normalizeThemeStore(data)

    cachedThemeStore = themeStore
    cacheTime = now
    return { ok: true, themeStore, cached: false }
  } catch (e) {
    return {
      ok: true,
      themeStore: cachedThemeStore || createEmptyThemeStore(),
      cached: Boolean(cachedThemeStore)
    }
  }
}
