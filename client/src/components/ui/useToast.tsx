import { useEffect, useState } from 'react'
import { Toast } from './Toast'

export interface ToastMessage {
  id: number
  text: string
  tone: 'success' | 'error'
}

/** Lightweight toast used for success/error feedback (toasts auto-dismiss). */
export function useToast(timeout = 3000) {
  const [toast, setToast] = useState<ToastMessage | null>(null)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), timeout)
    return () => window.clearTimeout(timer)
  }, [toast, timeout])

  const showSuccess = (text: string) => setToast({ id: Date.now(), text, tone: 'success' })
  const showError = (text: string) => setToast({ id: Date.now(), text, tone: 'error' })

  const node = toast ? <Toast toast={toast} /> : null

  return { toast: node, showSuccess, showError }
}

export default useToast
