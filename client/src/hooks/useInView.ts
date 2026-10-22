import { useEffect, useRef, useState } from 'react'

interface UseInViewOptions {
  /** How much of the element must be visible before triggering. */
  threshold?: number
  /** Keep observing after the first intersection (defaults to true). */
  once?: boolean
}

/**
 * Observes an element and reports when it enters the viewport, so landing
 * sections can run CSS scroll-reveal transitions.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(options?: UseInViewOptions) {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)
  const threshold = options?.threshold ?? 0.15
  const once = options?.once ?? true

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry) return
        if (entry.isIntersecting) {
          setInView(true)
          if (once) observer.disconnect()
        } else if (!once) {
          setInView(false)
        }
      },
      { threshold },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [threshold, once])

  return { ref, inView }
}
