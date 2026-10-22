import { useEffect, useRef, type ReactNode } from 'react'

interface CollapseProps {
  open: boolean
  children: ReactNode
  className?: string
}

/**
 * React equivalent of Vue's `<transition name="expand">`: the content is always
 * mounted and the wrapper animates its height, so collapsing and expanding
 * keeps the same easing and timing as the original interface.
 */
export function Collapse({ open, children, className }: CollapseProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const heightRef = useRef(0)

  useEffect(() => {
    const element = contentRef.current
    if (element) {
      heightRef.current = element.scrollHeight
    }
  }, [children, open])

  return (
    <div
      className={className}
      style={{
        height: open ? heightRef.current : 0,
        overflow: 'hidden',
        transition: 'height 0.3s ease',
      }}
    >
      <div ref={contentRef}>{children}</div>
    </div>
  )
}

export default Collapse
