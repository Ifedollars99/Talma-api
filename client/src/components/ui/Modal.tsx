import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  open: boolean
  onClose: () => void
  labelledBy?: string
  /** Clicking the backdrop closes the modal (disabled for critical confirmations). */
  closeOnBackdrop?: boolean
  children: ReactNode
  className?: string
}

/**
 * Counts how many modals are currently open so the page scroll lock is only
 * released once the last one closes.
 */
let openModalCount = 0

/**
 * Accessible modal shell used across the dashboard. The original interface
 * used fixed overlays with a semi-transparent navy backdrop; this keeps the
 * same look while adding focus handling, Escape-to-close and a portal so the
 * overlay is never clipped by a scrolling ancestor.
 */
export function Modal({
  open,
  onClose,
  labelledBy,
  closeOnBackdrop = true,
  children,
  className = 'bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full',
}: ModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)

    openModalCount += 1
    if (openModalCount === 1) {
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      openModalCount = Math.max(0, openModalCount - 1)
      if (openModalCount === 0) {
        document.body.style.overflow = ''
      }
    }
  }, [open, onClose])

  if (!open || !mounted) return null

  return createPortal(
    <div
      className="fixed inset-0 bg-[#0a0a0a]/60 flex items-center justify-center z-[70] px-4"
      onClick={closeOnBackdrop ? onClose : undefined}
      role="presentation"
    >
      <div
        className={className}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}

export default Modal
