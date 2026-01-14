import * as React from 'react'

/**
 * Custom hook to detect media query changes
 * @param query - Media query string (e.g., '(max-width: 768px)')
 * @returns boolean | undefined - undefined on server/first render, then true/false based on query match
 */
export function useMediaQuery(query: string): boolean | undefined {
    // Always start with undefined to match server render and avoid hydration mismatch
    const [matches, setMatches] = React.useState<boolean | undefined>(undefined)

    // Use useLayoutEffect for synchronous DOM measurement before paint
    // Falls back to useEffect on server (which is fine since it won't run)
    const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect

    useIsomorphicLayoutEffect(() => {
        // Set up media query listener
        const mql = window.matchMedia(query)
        const onChange = () => {
            setMatches(mql.matches)
        }

        mql.addEventListener('change', onChange)

        // Set initial value from media query
        setMatches(mql.matches)

        return () => mql.removeEventListener('change', onChange)
    }, [query])

    return matches
}
