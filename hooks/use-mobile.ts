import * as React from 'react'

const MOBILE_BREAKPOINT = 768
const STORAGE_KEY = 'imprecv:isMobile'

export function useIsMobile() {
  // Always start with undefined to match server render and avoid hydration mismatch
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  // Use useLayoutEffect for synchronous DOM measurement before paint
  // Falls back to useEffect on server (which is fine since it won't run)
  const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect

  useIsomorphicLayoutEffect(() => {
    // First, try to use cached value for instant UI (avoids flash)
    try {
      const cached = window.localStorage.getItem(STORAGE_KEY)
      if (cached !== null) {
        setIsMobile(cached === 'true')
      }
    } catch {
      // localStorage not available
    }

    // Then set up media query listener for real-time updates
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      const value = mql.matches
      setIsMobile(value)
      try {
        window.localStorage.setItem(STORAGE_KEY, String(value))
      } catch {
        // localStorage not available
      }
    }
    
    mql.addEventListener('change', onChange)
    
    // Set actual value from media query
    const actualValue = mql.matches
    setIsMobile(actualValue)
    try {
      window.localStorage.setItem(STORAGE_KEY, String(actualValue))
    } catch {
      // localStorage not available
    }
    
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return isMobile
}
