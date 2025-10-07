import { useEffect, useState } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    setMatches(media.matches)

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches)
    media.addEventListener('change', listener)

    return () => media.removeEventListener('change', listener)
  }, [query])

  return matches
}

// Helper hook específico para mobile
export function useIsMobile() {
  return useMediaQuery('(max-width: 768px)')
}

// Helper hook para tablet
export function useIsTablet() {
  return useMediaQuery('(min-width: 769px) and (max-width: 1024px)')
}

// Helper hook para desktop
export function useIsDesktop() {
  return useMediaQuery('(min-width: 1025px)')
}
