import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useTheme } from '../../lib/theme'

const THEMED_PREFIXES = ['/u/', '/hubs/']
const THEMED_ROUTES = new Set(['/mycamp', '/myprofile'])

/**
 * Keeps the saved theme on the document root only while a product screen is
 * active. It lives outside the lazy-route Suspense boundary so navigating
 * between app screens never flashes the light theme.
 *
 * Landing and auth screens are intentionally excluded.
 */
export default function AppTheme() {
  const { theme } = useTheme()
  const { pathname } = useLocation()

  const normalizedPath = pathname.replace(/\/+$/, '') || '/'
  const isThemed =
    THEMED_ROUTES.has(normalizedPath) ||
    THEMED_PREFIXES.some((prefix) => normalizedPath.startsWith(prefix))

  useLayoutEffect(() => {
    const root = document.documentElement

    if (isThemed) {
      root.dataset.theme = theme
      root.style.colorScheme = theme
    } else {
      delete root.dataset.theme
      root.style.colorScheme = ''
    }

    return () => {
      delete root.dataset.theme
      root.style.colorScheme = ''
    }
  }, [isThemed, theme])

  return null
}
