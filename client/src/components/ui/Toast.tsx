import type { ToastMessage } from './useToast'

interface ToastProps {
  toast: ToastMessage
}

/** The toast surface rendered by the `useToast` hook. */
export function Toast({ toast }: ToastProps) {
  return (
    <div
      role="status"
      className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 z-[100] text-white animate-toast-in ${
        toast.tone === 'success' ? 'bg-[#15803d]' : 'bg-[#8a6d00]'
      }`}
    >
      <i
        className={`bi ${
          toast.tone === 'success' ? 'bi-check-circle' : 'bi-exclamation-circle'
        } text-xl`}
      />
      <span>{toast.text}</span>
    </div>
  )
}

export default Toast
